-- notes API database schema
-- kör detta en gång i en tom PostgreSQL database (t.ex Neon's SQL Editor). 

CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  allowed_user_ids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exempel för testing.
-- byt dessa test id med riktiga user ids från login servicen.
INSERT INTO boards (name, allowed_user_ids) VALUES
  ('Project Alpha', ARRAY['1', '2']),
  ('Project Beta', ARRAY['2']);