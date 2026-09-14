import type { Request, Response } from "express";

import { AdvancedError } from "kage-library";

import { log, wc } from "../../instances.js";
import { assertBearer } from "../../../_common/asserts/bearer.assert.js";
import { assertPlatformPermissions } from "../../../_common/asserts/platformPermissions.assert.js";
import { i18n } from "../../../_common/instances.js";
import { assertAccount } from "../../../_common/asserts/account.assert.js";
import { db } from "../../databases/db.js";
import { assertDbSuccess } from "../../../../_common/asserts/dbSuccess.assert.js";
import whatIs from "../../helpers/whatIs.js";
import uploadFile from "../../../_common/helpers/uploadFile.js";
import { LinkType } from "../../../../_common/types/link.type.js";
import { UsernameType } from "../../../../_common/types/username.type.js";
import { config } from "../../../../../app.config.js";
import getEnv from "../../../../_common/helpers/getEnv.js";

const VALID_VISIBILITIES = ["default", "public", "registered", "followers", "friends", "private"] as const;
const ALLOWED_VISIBILITIES = ["public", "unlisted", "registered", "followers", "friends", "private"];
const VALID_SEND_VISIBILITIES = ["default", "registered", "followers", "friends", "private"] as const;
const VALID_TYPES = ["user", "author", "publisher"] as const;
const VALID_PRESENCES = ["online", "idle", "dnd", "offline"] as const;
const TAG_REGEX = /^[a-z-]+$/;

export const updateUsers = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { data } = req.body;

        await assertBearer(req); 
        assertAccount(req.session);
        assertPlatformPermissions(req.session, "WRITE");

        if (userId !== req.session.userId) {
            throw new AdvancedError({
                code: 401,
                message: i18n.t("responses.unauthorized")
            });
        }

        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
            throw new AdvancedError({
                code: 400,
                message: i18n.t("responses.malformedRequest")
            });
        }

        const whatIsData = whatIs(userId);

        const currentresult = db.users.query(
            `SELECT * FROM users WHERE id = ?`,
            [userId]
        );

        assertDbSuccess(currentresult);

        const currentUser = currentresult.rows?.[0];

        if (!currentUser) {
            throw new AdvancedError({
                code: 404,
                message: i18n.t("responses.accountNotFound")
            });
        }

        const allowedFields = new Set([
            "displayName",
            "fanflair",
            "avatar",
            "animatedAvatar",
            "banner",
            "status",
            "about",
            "markdown",
            "tags",
            "pronouns",
            "birthDate",
            "birthDateVisibility",
            "foundedDate",
            "foundedDateVisibility",
            "location",
            "isAuraEnabled",
            "auraType",
            "auraPrimary",
            "auraSecondary",
            "type",
            "isDeveloper",
            "isSensitive",
            "isMature",
            "visibility",
            "areFriendRequestsEnabled",
            "sendMessages",
            "sendComments",
            "presence",
            "isOnline",
            "usernames",
            "links"
        ]);

        let uploadedAvatar;
        let uploadedAnimatedAvatar;
        let uploadedBanner;

        if (data.avatar) {
            uploadedAvatar = await uploadFile({
                folder: `users/avatars/${userId}`,
                fileInput: data.avatar
            });
        }

        if (data.animatedAvatar) {
            uploadedAnimatedAvatar = await uploadFile({
                folder: `users/avatars/${userId}`,
                fileInput: data.animatedAvatar
            });
        }

        if (data.banner) {
            uploadedBanner = await uploadFile({
                folder: `users/banners/${userId}`,
                fileInput: data.banner
            });
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        let links: LinkType[] | undefined;
        let usernames: UsernameType[] | undefined;
        let updatedPresence: string | undefined;

        // eslint-disable-next-line prefer-const
        for (let [key, value] of Object.entries(data)) {
            if (!allowedFields.has(key) || value === undefined) {
                continue;
            }

            if (key === "usernames") {
                if (!Array.isArray(value)) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.malformedRequest")
                    });
                }

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const result = db.users.query<{ username: string }>(
                    `SELECT username FROM usernames WHERE userId = ?`,
                    [userId]
                );
                
                assertDbSuccess(result);

                const existingUsernamesSet = new Set(
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    (result.rows ?? []).map((u) => u.username.toLowerCase())
                );

                const processedUsernames: UsernameType[] = [];
                const seenInRequest = new Set<string>();

                for (const item of value) {
                    if (!item || typeof item.username !== "string") {
                        continue;
                    }

                    const formattedUsername = item.username
                        .toLowerCase()
                        .replace(/[^a-z0-9_.-]/g, "")
                        .slice(0, 24);

                    if (seenInRequest.has(formattedUsername)) {
                        continue;
                    }

                    if (formattedUsername.length < 3 || formattedUsername.length > 24) {
                        throw new AdvancedError({
                            code: 400,
                            message: `${i18n.t("responses.invalidUsernameLength")} ${formattedUsername}`
                        });
                    }

                    if (!existingUsernamesSet.has(formattedUsername)) {
                        const usernameResult: { isAvailable: boolean } = await wc.callAPI(
                            `https://${config.domains.api}/v3/usernames`,
                            {
                                method: "POST",
                                auth: `ApiSecret ${getEnv("API_SECRET")}`,
                                body: { username: formattedUsername },
                            }
                        );

                        if (!usernameResult.isAvailable) {
                            throw new AdvancedError({
                                code: 409,
                                message: `${i18n.t("responses.takenUsername")} ${formattedUsername}`
                            });
                        }
                    }

                    seenInRequest.add(formattedUsername);
                    processedUsernames.push({
                        ...item,
                        username: formattedUsername
                    });
                }

                usernames = processedUsernames;
                continue;
            }

            if (key === "links") {
                if (!Array.isArray(value)) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.malformedRequest")
                    });
                }

                links = value;
                continue;
            }

            if (key === "displayName") {
                if (typeof value !== "string" || value.length > 32) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidDisplayNameLength")
                    });
                }
            }

            if (key === "pronouns" || key === "location") {
                if (typeof value !== "string" || value.length > 64) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidLength")
                    });
                }
            }

            if (key === "status") {
                if (typeof value !== "string" || value.length > 160) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidStatusLength")
                    });
                }
            }

            if (key === "avatar") {
                value = uploadedAvatar?.path;
            } else if (key === "animatedAvatar") {
                value = uploadedAnimatedAvatar?.path;
            } else if (key === "banner") {
                value = uploadedBanner?.path;
            }

            if (
                [
                    "animatedAvatar", 
                    "isAuraEnabled", 
                    "auraType", 
                    "auraPrimary", 
                    "auraSecondary"
                ].includes(key)
            ) {
                if (!whatIsData.isPremium) {
                    throw new AdvancedError({
                        code: 403,
                        message: i18n.t("responses.premiumRequired")
                    });
                }
            }

            if (key === "about") {
                if (typeof value !== "string" || value.length > 320) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidAboutLength")
                    });
                }
            }

            if (key === "markdown") {
                if (typeof value !== "string" || value.length > 16384) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidMarkdownLength")
                    });
                }
            }

            if (key === "tags") {
                let parsedTags: string[] = [];

                if (typeof value === "string") {
                    parsedTags = value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0);
                } else if (Array.isArray(value)) {
                    parsedTags = value
                        .map((t) => (typeof t === "string" ? t.trim() : ""))
                        .filter((t) => t.length > 0);
                } else {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidTagsFormat")
                    });
                }

                const isValid =
                    parsedTags.length > 0 &&
                    parsedTags.every(
                        (t) => t.length >= 3 && t.length <= 24 && TAG_REGEX.test(t)
                    );

                if (!isValid) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidTagsFormat")
                    });
                }

                updates.push(`${key} = ?`);
                values.push(JSON.stringify(parsedTags));
                continue;
            }

            if (key === "birthDate" || key === "foundedDate") {
                if (value !== null) {
                    const FLEXIBLE_DATE_REGEX = /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/;

                    if (typeof value !== "string" || !FLEXIBLE_DATE_REGEX.test(value) || isNaN(Date.parse(value))) {
                        throw new AdvancedError({
                            code: 400,
                            message: i18n.t("responses.invalidDateFormat")
                        });
                    }

                    if (key === "birthDate") {
                        const normalizedDateStr = value.length === 4 
                            ? `${value}-01-01` 
                            : value.length === 7 
                                ? `${value}-01` 
                                : value;

                        const birthDate = new Date(normalizedDateStr);
                        const today = new Date();

                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();

                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }

                        if (age < 13) {
                            throw new AdvancedError({
                                code: 400,
                                message: i18n.t("responses.underage")
                            });
                        }
                    }
                }
            }

            if (key === "birthDateVisibility" || key === "foundedDateVisibility") {
                if (!VALID_VISIBILITIES.includes(value as typeof VALID_VISIBILITIES[number])) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidVisibility")
                    });
                }
            }

            if (key === "presence") {
                if (!VALID_PRESENCES.includes(value as typeof VALID_PRESENCES[number])) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidPresence")
                    });
                }
                
                updatedPresence = value as string;
            }

            if (key === "visibility") {
                if (currentUser.visibility === "hidden") {
                    throw new AdvancedError({
                        code: 401,
                        message: i18n.t("responses.cannotChangeHiddenState")
                    });
                }

                if (!ALLOWED_VISIBILITIES.includes(value as string)) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidVisibility")
                    });
                }
            }

            if (key === "sendMessages" || key === "sendComments") {
                if (currentUser[key] === "hidden") {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.cannotChangeHiddenState")
                    });
                }

                if (!VALID_SEND_VISIBILITIES.includes(value as typeof VALID_SEND_VISIBILITIES[number])) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidVisibility")
                    });
                }
            }

            if (key === "type") {
                if (!VALID_TYPES.includes(value as typeof VALID_TYPES[number])) {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.invalidType")
                    });
                }
            }

            if (
                [
                    "isDeveloper", 
                    "isSensitive", 
                    "isMature", 
                    "areFriendRequestsEnabled", 
                    "isAuraEnabled"
                ].includes(key)
            ) {
                if (typeof value !== "boolean" && typeof value !== "number") {
                    throw new AdvancedError({
                        code: 400,
                        message: i18n.t("responses.malformedRequest")
                    });
                }

                if (typeof value === "number") {
                    if (value !== 0 && value !== 1) {
                        throw new AdvancedError({
                            code: 400,
                            message: i18n.t("responses.malformedRequest")
                        });
                    }
                    value = Boolean(value);
                }
            }

            updates.push(`${key} = ?`);
            values.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
        }

        if (updates.length === 0 && !links && !usernames) {
            throw new AdvancedError({
                code: 400,
                message: i18n.t("responses.malformedRequest")
            });
        }

        if (updates.length > 0) {
            values.push(userId);

            const result = db.users.query(
                `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
                values
            );

            assertDbSuccess(result);

            if (updatedPresence) {
                await wc.callAPI(
                    `https://${config.domains.main}/websocket`,
                    {
                        method: "POST",
                        auth: `ApiSecret ${getEnv("API_SECRET")}`,
                        body: {
                            userId,
                            data: {
                                presence: {
                                    id: userId,
                                    presence: updatedPresence,
                                    lastActive: currentUser.lastActive
                                }
                            }
                        }
                    }
                );
            }
        }

        if (usernames) {
            const validUsernames = usernames.filter(
                (item): item is NonNullable<typeof item> => Boolean(item && typeof item.username === "string" && item.username.trim().length > 0)
            );

            if (validUsernames.length > 3) {
                throw new AdvancedError({
                    code: 400,
                    message: i18n.t("responses.usernameLimit")
                });
            }

            if (validUsernames.length === 0) {
                const deleteResult = db.users.query(
                    `DELETE FROM usernames WHERE userId = ?`,
                    [userId]
                );

                assertDbSuccess(deleteResult);
            } else {
                const result = db.users.query<{ userId: string; username: string }>(
                    `SELECT userId, username FROM usernames WHERE userId = ?`,
                    [userId]
                );

                assertDbSuccess(result);

                const existingUsernames = result.rows ?? [];
                const existingNames = new Set(existingUsernames.map((u) => u.username));

                const newNames = new Set(validUsernames.map((u) => u.username));
                const toInsert: Array<{ item: typeof validUsernames[number]; position: number }> = [];

                validUsernames.forEach((item, position) => {
                    if (existingNames.has(item.username)) {
                        const updateResult = db.users.query(
                            `UPDATE usernames 
                            SET isPrimary = ?, position = ? 
                            WHERE userId = ? AND username = ?`,
                            [
                                item.isPrimary ? 1 : 0,
                                position,
                                userId,
                                item.username
                            ]
                        );

                        assertDbSuccess(updateResult);
                    } else {
                        toInsert.push({ item, position });
                    }
                });

                const usernamesToDelete = existingUsernames
                    .filter((existing) => !newNames.has(existing.username))
                    .map((existing) => existing.username);

                if (usernamesToDelete.length > 0) {
                    const deletePlaceholders = usernamesToDelete.map(() => "?").join(", ");

                    const deleteResult = db.users.query(
                        `DELETE FROM usernames WHERE userId = ? AND username IN (${deletePlaceholders})`,
                        [userId, ...usernamesToDelete]
                    );

                    assertDbSuccess(deleteResult);
                }

                if (toInsert.length > 0) {
                    const valuePlaceholders = toInsert.map(() => "(?, ?, ?, ?)").join(", ");

                    const queryParams = toInsert.flatMap(({ item, position }) => [
                        userId,
                        item.username,
                        item.isPrimary ? 1 : 0,
                        position
                    ]);

                    const insertResult = db.users.query(
                        `INSERT INTO usernames (
                            userId, 
                            username,
                            isPrimary,
                            position
                        ) VALUES ${valuePlaceholders}`,
                        queryParams
                    );

                    assertDbSuccess(insertResult);
                }
            }
        }

        if (links) {
            const validLinks = links.filter(
                (link): link is NonNullable<typeof link> => Boolean(link && typeof link.url === "string")
            );

            if (validLinks.length > 15) {
                throw new AdvancedError({
                    code: 400,
                    message: i18n.t("responses.linkLimit")
                });
            }

            if (validLinks.length === 0) {
                const deleteResult = db.links.query(
                    `DELETE FROM links WHERE assetId = ?`,
                    [userId]
                );

                assertDbSuccess(deleteResult);
            } else {
                const result = db.links.query<{ assetId: string; url: string }>(
                    `SELECT assetId, url FROM links WHERE assetId = ?`,
                    [userId]
                );

                assertDbSuccess(result);

                const existingLinks = result.rows ?? [];
                const existingUrls = new Set(existingLinks.map((l) => l.url));

                const newUrls = new Set(validLinks.map((l) => l.url));
                const toInsert: Array<{ link: typeof validLinks[number]; order: number }> = [];

                validLinks.forEach((link, order) => {
                    if (existingUrls.has(link.url)) {
                        const updateResult = db.links.query(
                            `UPDATE links 
                            SET label = ?, previewText = ?, visibility = ?, position = ? 
                            WHERE assetId = ? AND url = ?`,
                            [
                                link?.label ?? null,
                                link?.previewText ?? null,
                                link?.visibility ?? "public",
                                order,
                                userId,
                                link.url
                            ]
                        );

                        assertDbSuccess(updateResult);
                    } else {
                        toInsert.push({ link, order });
                    }
                });

                const urlsToDelete = existingLinks
                    .filter((existing) => !newUrls.has(existing.url))
                    .map((existing) => existing.url);

                if (urlsToDelete.length > 0) {
                    const deletePlaceholders = urlsToDelete.map(() => "?").join(", ");

                    const deleteResult = db.links.query(
                        `DELETE FROM links WHERE assetId = ? AND url IN (${deletePlaceholders})`,
                        [userId, ...urlsToDelete]
                    );

                    assertDbSuccess(deleteResult);
                }

                if (toInsert.length > 0) {
                    const valuePlaceholders = toInsert.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");

                    const queryParams = toInsert.flatMap(({ link, order }) => [
                        userId,
                        link.url,
                        link?.label ?? null,
                        link?.previewText ?? null,
                        link?.visibility ?? "public",
                        order
                    ]);

                    const insertResult = db.links.query(
                        `INSERT INTO links (
                            assetId, 
                            url,
                            label,
                            previewText,
                            visibility,
                            position
                        ) VALUES ${valuePlaceholders}`,
                        queryParams
                    );

                    assertDbSuccess(insertResult);
                }
            }
        }

        return res.status(200).json({
            ok: true,
        });
    } catch(error) {
        if (error instanceof AdvancedError) {
            log.db.error(error).save();
            return res.status(error.code).json({
                id: error.id,
                message: error.message
            });
        } else {
            log.unknown.error(error).save();
            return res.status(500).json({
                message: i18n.t("responses.unknown"),
            });
        }
    }
};
