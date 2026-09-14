import { DateTime } from "luxon";

import { db, mdb } from "../../db.js";
import { log } from "../../../instances.js";

const result = mdb.accounts.query("SELECT * from public");

db.users.transaction(q => {
    if (!result.success) return log.db.error(result.error).save();

    for (const d of result.rows) {
        if (d.id === "5019646586243236") {
            // Username handles
            d.username = "j9"
            d.username_old = "j9studios"
        }

        const primaryResult = q(
            `INSERT INTO usernames (
                userId,
                username,
                isPrimary,
                addedDate
            ) VALUES (?, ?, ?, ?)`,
            [
                d.id,
                d.username,
                1,
                DateTime.fromSQL(d.created_date as string, { zone: "utc" }).toISO()
            ]
        );

        if (!primaryResult.success) return log.db.error(primaryResult.error).save();

        if (d.username_old) {
            const secondaryResult = q(
                `INSERT INTO usernames (
                    userId,
                    username,
                    isPrimary,
                    addedDate
                ) VALUES (?, ?, ?, ?)`,
                [
                    d.id,
                    d.username_old,
                    0,
                    DateTime.fromSQL(d.username_old_expire as string, { zone: "utc" }).minus({ days: 14 }).toISO()
                ]
            );

            if (!secondaryResult.success) return log.db.error(secondaryResult.error).save();
        }
    }
})
