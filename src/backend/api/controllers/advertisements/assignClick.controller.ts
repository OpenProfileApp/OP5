import type { Request, Response } from "express";

import { AdvancedError } from "kage-library";
import { assertBearer } from "../../../_common/asserts/bearer.assert.js";
import { log } from "../../instances.js";
import { i18n } from "../../../_common/instances.js";
import { assertDbSuccess } from "../../../../_common/asserts/dbSuccess.assert.js";
import { db } from "../../databases/db.js";
import { AdvertisementType } from "../../../../_common/types/advertisement.type.js";

export const assignClickController = async (req: Request, res: Response) => {
    try {
        const { id, adSlot } = req.params;

        await assertBearer(req);

        const adResult = db.advertisements.query<AdvertisementType>(
            `SELECT * FROM pool WHERE id = ? AND isActive = 1 LIMIT 1`,
            [id]
        );
        
        assertDbSuccess(adResult)

        if (adResult.rowCount === 0) {
            return res.status(404).json({
                ok: false
            });
        }

        const ad = adResult.rows[0];
        const source = req.session?.userId || req.ip;

        const clickResult = db.advertisements.query(
            `INSERT INTO clicks (source, target, adSlot, date)
             SELECT ?, ?, ?, STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now')
             WHERE NOT EXISTS (
                 SELECT 1 FROM clicks 
                 WHERE source = ? 
                   AND target = ? 
                   AND date >= STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now', '-24 hours')
             )`,
            [source, id, adSlot, source, id]
        );

        assertDbSuccess(clickResult);

       if (!ad.isUnlimitedClicks) {
            const updateResult = db.advertisements.query(
                `UPDATE pool 
                SET clicksLeft = clicksLeft - 1 
                WHERE id = ?`,
                [id]
            );

            assertDbSuccess(updateResult);
        }

        return res.status(200).json({
            ok: true
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
