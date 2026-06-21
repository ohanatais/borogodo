ALTER TABLE entries ADD COLUMN IF NOT EXISTS title TEXT;

CREATE INDEX IF NOT EXISTS entries_user_entry_date_idx
  ON entries (user_id, entry_date DESC NULLS LAST);
