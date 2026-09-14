import type { Request, Response } from "express";
import { DateTime } from "luxon";

import { AdvancedError } from "kage-library";

import { log } from "../../instances.js";
import { i18n } from "../../../_common/instances.js";
import { db } from "../../databases/db.js";
import { assertDbSuccess } from "../../../../_common/asserts/dbSuccess.assert.js";
import getEnv from "../../../../_common/helpers/getEnv.js";

export const updateUserPresence = async (req: Request, res: Response) => {
    try {
        const { userId, type } = req.params;
        
        const authHeader = req.headers.authorization;

        let isAuthorized = false;

        if (authHeader?.startsWith("ApiSecret ")) {
            isAuthorized = authHeader.split(" ")[1] === getEnv("API_SECRET");
        }

        if (!isAuthorized) {
            throw new AdvancedError({
                code: 401,
                message: i18n.t("responses.unauthorized")
            });
        }

        const allowedTypes = ["online", "idle", "dnd", "offline"];

        if (!allowedTypes.includes(type as string)) {
            return res.status(400).json({
                ok: false,
                message: i18n.t("responses.invalidPresence")
            });
        }

        const userResult = db.users.query(
            `SELECT presence, isOnline FROM users WHERE id = ?`,
            [userId]
        );

        assertDbSuccess(userResult);

        const currentUser = userResult.rows?.[0];

        if (!currentUser) {
            throw new AdvancedError({
                code: 404,
                message: i18n.t("responses.accountNotFound")
            });
        }

        const nowIso = DateTime.now().toUTC().toISO();

        if (currentUser.presence === "offline" || type === "offline") {
            const result = db.users.query(
                "UPDATE users SET isOnline = 0 WHERE id = ?",
                [userId]
            );

            assertDbSuccess(result);

            return res.status(200).json({
                ok: false,
            });
        }

        if (currentUser.presence === "dnd") {
            const result = db.users.query(
                "UPDATE users SET isOnline = 1, lastActive = ? WHERE id = ?",
                [nowIso, userId]
            );

            assertDbSuccess(result);

            return res.status(200).json({
                ok: false
            });
        }

        const result = db.users.query(
            "UPDATE users SET presence = ?, isOnline = 1, lastActive = ? WHERE id = ?",
            [type, nowIso, userId]
        );

        assertDbSuccess(result);

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
