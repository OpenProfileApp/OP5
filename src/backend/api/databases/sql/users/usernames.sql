CREATE TABLE IF NOT EXISTS usernames (
    userId TEXT NOT NULL,
    username TEXT PRIMARY KEY NOT NULL,
    isPrimary INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    addedDate TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
