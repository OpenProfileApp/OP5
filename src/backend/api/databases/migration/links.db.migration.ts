import { DateTime } from "luxon";

import { db, mdb } from "../db.js";
import { log } from "../../instances.js";

const domains: Record<string, string> = {
    website: "",
    youtube: "https://youtube.com/@",
    x: "https://x.com/",
    bluesky: "https://bsky.app/profile/",
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/@",
    twitch: "https://twitch.tv/",
    discord: "https://discord.com/",
    github: "https://github.com/"
};

function normalizeLink(rawInput: string, platformName: string) {
    if (!rawInput) return { url: "", previewText: "" };

    const platform = platformName?.toLowerCase();
    const isWebsite = platform === "website";

    let clean = rawInput.trim().replace(/^@?https?:\/+/i, "");

    if (clean.startsWith("@")) {
        clean = clean.slice(1);
    }

    let url = "";
    let previewText = "";

    if (clean.startsWith("http://") || clean.startsWith("https://")) {
        url = clean;
    } else if (clean.includes(".")) {
        url = `https://${clean}`;
    } else {
        const domainPrefix = domains[platform] ?? "";
        url = domainPrefix ? `${domainPrefix}${clean}` : clean;
        if (!isWebsite) {
            previewText = `@${clean}`;
        }
    }

    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    if (!previewText && url) {
        try {
            const parsed = new URL(url);

            if (isWebsite) {
                previewText = parsed.hostname.replace(/^www\./i, "");
            } else {
                const pathname = parsed.pathname.replace(/\/$/, "");
                if (pathname && pathname !== "/") {
                    const parts = pathname.split("/").filter(Boolean);
                    const lastPart = parts[parts.length - 1];
                    previewText = `@${lastPart.replace(/^@/, "")}`;
                } else {
                    previewText = parsed.hostname.replace(/^www\./i, "");
                }
            }
        } catch {
            previewText = rawInput;
        }
    }

    return { url, previewText };
}

const result = mdb.accounts.query("SELECT * from connections");

db.links.transaction(q => {
    if (!result.success) return log.db.error(result.error).save();

    for (const d of result.rows) {
        if (d.verified) continue;

        const rawValue = (d.id || d.text || "").toString();
        const { url } = normalizeLink(rawValue, d.name as string);

        const insertResult = q(
            `INSERT INTO links (
                assetId,
                url,
                visibility,
                date
            ) VALUES (?, ?, ?, ?)`,
            [
                d.user,
                url,
                d.visibility || "public",
                DateTime.fromSQL(d.date as string, { zone: "utc" }).toISO()
            ]
        );

        if (!insertResult.success) return log.db.error(insertResult.error).save();
    }
});
