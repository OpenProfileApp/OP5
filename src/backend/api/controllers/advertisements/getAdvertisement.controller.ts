import type { Request, Response } from "express";

import { AdvancedError } from "kage-library";
import { assertBearer } from "../../../_common/asserts/bearer.assert.js";
import { log } from "../../instances.js";
import { i18n } from "../../../_common/instances.js";
import getInterestsService from "../../services/getInterests.service.js";
import { InterestItemType } from "../../../../_common/types/interest.type.js";
import whatIs from "../../helpers/whatIs.js";
import { AdvertisementType } from "../../../../_common/types/advertisement.type.js";
import { db } from "../../databases/db.js";
import { assertDbSuccess } from "../../../../_common/asserts/dbSuccess.assert.js";

function getTopTargetTags(interests: InterestItemType[], maxTags = 5): string[] {
    if (!Array.isArray(interests) || interests.length === 0) return [];

    const scoreGroups = interests.reduce<Record<number, InterestItemType[]>>((acc, item) => {
        acc[item.algorithmScore] = acc[item.algorithmScore] || [];
        acc[item.algorithmScore].push(item);
        return acc;
    }, {});

    const sortedScores = Object.keys(scoreGroups)
        .map(Number)
        .sort((a, b) => b - a);

    const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
    const weekSeed = Math.floor(Date.now() / oneWeekMs);

    const selectedTags: string[] = [];

    for (const score of sortedScores) {
        if (selectedTags.length >= maxTags) break;

        const group = scoreGroups[score];

        if (group.length === 1) {
            selectedTags.push(group[0].tag);
        } else {
            const offset = (weekSeed + selectedTags.length) % group.length;
            const reorderedGroup = [
                ...group.slice(offset),
                ...group.slice(0, offset)
            ];

            for (const item of reorderedGroup) {
                if (selectedTags.length < maxTags && !selectedTags.includes(item.tag)) {
                    selectedTags.push(item.tag);
                }
            }
        }
    }

    return selectedTags.slice(0, maxTags);
}

async function selectBestAd(
    targetTags: string[],
    source: string,
    adSlot: string
): Promise<AdvertisementType | null> {
    const baseConditions = "WHERE isActive = 1 AND (isUnlimitedClicks = 1 OR CAST(clicksLeft AS SIGNED) > 0)";

    let selectedAd: AdvertisementType | null = null;

    if (targetTags.length > 0) {
        const tagConditions = targetTags.map(() => `tags LIKE ?`).join(" OR ");

        const priorityCases = targetTags
            .map((_, index) => `WHEN tags LIKE ? THEN ${index + 1}`)
            .join(" ");

        const likePatterns = targetTags.map((tag) => `%${tag}%`);
        const queryParams = [...likePatterns, ...likePatterns];

        const query = `
            SELECT *, 
                CASE 
                    ${priorityCases}
                    ELSE 999 
                END AS tag_priority
            FROM pool 
            ${baseConditions} AND (${tagConditions})
            ORDER BY tag_priority ASC, RANDOM() 
            LIMIT 1
        `;

        const result = db.advertisements.query<AdvertisementType>(query, queryParams);

        assertDbSuccess(result);

        selectedAd = result.rows?.[0] || null;
    }

    if (!selectedAd) {
        const result = db.advertisements.query<AdvertisementType>(
            `SELECT * FROM pool ${baseConditions} ORDER BY RANDOM() LIMIT 1`
        );

        assertDbSuccess(result);

        selectedAd = result.rows?.[0] || null;
    }

    if (selectedAd) {
        const result = db.advertisements.query(
            `INSERT INTO views (source, target, adSlot, date)
            SELECT ?, ?, ?, STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE NOT EXISTS (
                SELECT 1 FROM views 
                WHERE source = ? 
                AND target = ? 
                AND date >= STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now', '-24 hours')
            )`,
            [source, selectedAd.id, adSlot, source, selectedAd.id]
        );

        assertDbSuccess(result);
    }

    return selectedAd;
}

export const advertisementsController = async (req: Request, res: Response) => {
    try {
        const { adSlot } = req.query;

        await assertBearer(req);

        let interests;

        if (req.session?.userId) {
            interests = getInterestsService(req.session.userId);
        }

        const targetTags = getTopTargetTags(
            (interests?.items || []) as unknown as InterestItemType[],
            5
        );

        const selectedAd = await selectBestAd(
            targetTags, 
            req.session?.userId || req.ip as string,
            adSlot as string
        );

        if (!selectedAd) {
            return res.status(404).json({
                ok: false,
            });
        }

        const whoIsProvider = whatIs(selectedAd.provierId);

        return res.status(200).json({
            id: selectedAd.id,
            imageUrl: selectedAd.imageUrl,
            targetUrl: selectedAd.onClickUrl,
            provider: whoIsProvider,
        });
    } catch (error) {
        if (error instanceof AdvancedError) {
            log.db.error(error).save();
            return res.status(error.code).json({
                id: error.id,
                message: error.message,
            });
        } else {
            log.unknown.error(error).save();
            return res.status(500).json({
                message: i18n.t("responses.unknown"),
            });
        }
    }
};
