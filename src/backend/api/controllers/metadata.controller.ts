import type { Request, Response } from "express";

import { AdvancedError } from "kage-library";

import { assertNotNull } from "../../../_common/asserts/notNull.assert.js";
import { log, wc } from "../instances.js";
import { i18n } from "../../_common/instances.js";

export const metadataController = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;

        assertNotNull(url);

        res.status(200).json({
            ...await wc.getMetadata(url as string)
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
