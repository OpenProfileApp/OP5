import type { Request, Response } from "express"
import path from "path"
import fs from "fs"

import { AdvancedError, getReqUrl } from "kage-library";

import { config } from "../../../../app.config.js"
import { vite } from "../server.js"
import { log } from "../instances.js"
import { i18n } from "../../_common/instances.js";

export const renderApp = async (req: Request, res: Response) => {
    const clientConfig = {
        isProduction: config.isProduction,
        useNerdFonts: config.useNerdFonts,
        theme: config.theme,
        metadata: config.metadata,
        domains: config.domains,
        integrations: {
            webPush: config.integrations.webPush,
            hcaptcha: config.integrations.hcaptcha,
            adsence: config.integrations.adsence,
            brandfetch: config.integrations.brandfetch,
            oauth2: config.integrations.oauth2
        },
    }

    try {
        const htmlPath = path.join(
            config.folders.root, "src", "frontend", "main.html"
        )

        let html = fs.readFileSync(htmlPath, "utf-8")

        html = html.replace(
            "__CLIENT_CONFIG__", 
            JSON.stringify(clientConfig)
        )

        if (vite) {
            html = await vite.transformIndexHtml(getReqUrl(req), html)
        }

        res.status(200).set({ "Content-Type": "text/html" }).end(html)
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
}
