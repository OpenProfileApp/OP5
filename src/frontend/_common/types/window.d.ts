export {};

import type { Config } from "../../../../app.config.ts";
import { PlatformPermissionNameType } from "../../../_common/types/permissions.type.ts";
import { GetUserItemType } from "../../../_common/types/user.type.ts";
import { SessionActionType } from "../../../_common/types/validSession.type.ts";

export type ClientConfig = {
    isProduction: Config["isProduction"]
    useNerdFonts: Config["useNerdFonts"];
    theme: Config["theme"];
    metadata: Config["metadata"];
    domains: Config["domains"];
    integrations: {
        webPush: Config["integrations"]["webPush"]
        hcaptcha: Config["integrations"]["hcaptcha"]
        adsence: Config["integrations"]["adsence"]
        brandfetch: Config["integrations"]["brandfetch"]
        oauth2: Config["integrations"]["oauth2"]
    }
};

export type ClientSession = {
    userId: string;
    permissions: {
        value: number;
        array: PlatformPermissionNameType[];
    };
    locale: string;
    timezone: string;
    delegatedAccounts?: string[];
    user?: GetUserItemType
    action?: SessionActionType
};

declare global {
    interface Window {
        config: ClientConfig,
        session: ClientSession,
        ws: unknown;
        adsbygoogle: unknown[];
    }
}
