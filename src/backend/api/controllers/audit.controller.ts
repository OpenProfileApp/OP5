import type { Request, Response } from "express";

import { AdvancedError } from "kage-library";

import createAuditLogService from "../services/createAuditLog.service.js";
import { log } from "../instances.js";
import { i18n } from "../../_common/instances.js";
import getEnv from "../../../_common/helpers/getEnv.js";

export const createAuditLogController = async (req: Request, res: Response) => {
    try {
        const { type, action, source, target, changes, origin } = req.body;

        const authHeader = req.headers.authorization;

        let isAuthorized = false;

        if (authHeader?.startsWith("ApiSecret ")) {
            isAuthorized = authHeader.split(" ")[1] === getEnv("API_SECRET");
        }

        if (!isAuthorized) {
            throw new AdvancedError({
                code: 401,
                message: i18n.t("responses.unauthorized")
            })
        }

        createAuditLogService(
            type,
            action,
            source,
            {
                target,
                changes,
                origin
            }
        );

        return res.status(200).json({ ok: true });
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
