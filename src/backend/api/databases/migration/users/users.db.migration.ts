import { DateTime } from "luxon";

import { db, mdb } from "../../db.js";
import { log, snowflake } from "../../../instances.js";
import uploadFile from "../../../../_common/helpers/uploadFile.js";
import { config } from "../../../../../../app.config.js";

const result = mdb.accounts.query("SELECT * from public");

db.users.transaction(async q => {
    if (!result.success) return log.db.error(result.error).save();

    for (const d of result.rows) {
        if (d.id === "5719552362357773") {
            d.developer = 1;
        }

        if (d.id === "9534968913312158") {
            d.flags = "1";
        }

        if (d.visibility === "followers") {
            d.visibility = "friends";
        }

        if (d.avatar) {
            try {
                const uploadedAvatar = await uploadFile({
                    folder: `users/avatars/${d.id}`,
                    fileInput: `https://${config.domains.cdn}${d.avatar}`
                });

                d.avatar = uploadedAvatar?.path;
            } catch {
                // continue
            }
        }

        if (d.banner) {
            try {
                const uploadedBanner = await uploadFile({
                    folder: `users/banners/${d.id}`,
                    fileInput: `https://${config.domains.cdn}${d.banner}`
                });

                d.banner = uploadedBanner?.path;
            } catch {
                // continue
            }
        }

        const result = q(
            `INSERT INTO users (
                algorithmScore,
                id,
                displayName,
                fanflair,
                avatar,
                banner,
                status,
                about,
                tags,
                birthDate,
                birthDateVisibility,
                foundedDate,
                foundedDateVisibility,
                theme,
                isAuraEnabled,
                auraType,
                auraPrimary,
                auraSecondary,
                type,
                flags,
                isDeveloper,
                isMature,
                visibility,
                sendMessages,
                lastActive,
                createdDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                d.score,
                d.id,
                d.display_name,
                d.fanflair,
                d.avatar,
                d.banner,
                d.status,
                d.about,
                JSON.stringify((d.tags as string ?? '').split(',').map(tag => tag.trim()).filter(Boolean)),
                d.birthdate 
                    ? DateTime.fromSQL(d.birthdate as string, { zone: "utc" }).toISODate() 
                    : null,
                d.birthdate_visibility,
                d.founded 
                    ? DateTime.fromSQL(d.founded as string, { zone: "utc" }).toISODate() 
                    : null,
                d.founded_visibility,
                d.theme,
                d.aura || 0,
                "flow",
                d.aura_primary,
                d.aura_secondary,
                d.type,
                d.flags || "0",
                d.developer || 0,
                d.explicit || 0,
                d.visibility || "public",
                d.messages,
                d.last_active,
                DateTime.fromSQL(d.created_date as string, { zone: "utc" }).toISO()
            ]
        );

        if (!result.success) return log.db.error(result.error).save();
    }
})

db.collections.transaction(async q => {
    if (!result.success) return log.db.error(result.error).save();

    for (const d of result.rows) {
        const result = q(
            `INSERT INTO collections (
                id,
                ownerId,
                displayName,
                isFavorites,
                updatedDate,
                createdDate
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                snowflake.gen(),
                d.id,
                "My Favorites",
                1,
                DateTime.fromSQL(d.created_date as string, { zone: "utc" }).toISO(),
                DateTime.fromSQL(d.created_date as string, { zone: "utc" }).toISO()
            ]
        );

        if (!result.success) return log.db.error(result.error).save();
    }
})
