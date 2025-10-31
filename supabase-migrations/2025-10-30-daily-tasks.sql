-- Daily tasks table to track personalized goals (deen or other)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- Private tasks: only owner can read/write
DROP POLICY IF EXISTS "public_read_daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "owner_write_daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "owner_read_daily_tasks" ON daily_tasks;

CREATE POLICY "owner_read_daily_tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_write_daily_tasks" ON daily_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);

