CREATE TABLE IF NOT EXISTS gv_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS gv_rooms (code TEXT PRIMARY KEY, game_id TEXT NOT NULL, rules_version TEXT NOT NULL, schema_version INTEGER NOT NULL, revision INTEGER NOT NULL, updated_at INTEGER NOT NULL, state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gv_profiles (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar TEXT, avatar_source TEXT NOT NULL DEFAULT 'default');
CREATE TABLE IF NOT EXISTS gv_recent (user_id TEXT NOT NULL, game_id TEXT NOT NULL, started_at INTEGER NOT NULL, PRIMARY KEY(user_id,game_id));
CREATE INDEX IF NOT EXISTS gv_recent_user ON gv_recent(user_id,started_at DESC);
CREATE TABLE IF NOT EXISTS gv_game_settings (game_id TEXT PRIMARY KEY, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gv_roles (user_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role='admin'));
CREATE TABLE IF NOT EXISTS gv_links (guest_id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
INSERT OR IGNORE INTO gv_migrations VALUES(1, unixepoch()*1000);
