CREATE TABLE IF NOT EXISTS gv_harmonies_leaderboard (
  mode TEXT NOT NULL CHECK(mode IN ('solo','competitive')),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  score INTEGER NOT NULL CHECK(score >= 0),
  achieved_at BIGINT NOT NULL,
  PRIMARY KEY(mode,user_id)
);
CREATE INDEX IF NOT EXISTS gv_harmonies_ranking ON gv_harmonies_leaderboard(mode,score DESC,achieved_at ASC,user_id ASC);
