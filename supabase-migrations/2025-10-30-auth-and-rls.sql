-- Add user ownership and enforce RLS: read-all, write-own

-- 1) Profiles: add user_id and policies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);


-- Make selects open, restrict writes to owner
DROP POLICY IF EXISTS "public_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "public_update_profiles" ON profiles;
DROP POLICY IF EXISTS "public_delete_profiles" ON profiles;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "owner_insert_profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_delete_profiles" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- 2) Entries: restrict writes to owner via profile link, keep reads open
DROP POLICY IF EXISTS "public_upsert_entries" ON entries;
DROP POLICY IF EXISTS "public_update_entries" ON entries;
DROP POLICY IF EXISTS "public_delete_entries" ON entries;

DROP POLICY IF EXISTS "public_read_entries" ON entries;
CREATE POLICY "public_read_entries" ON entries FOR SELECT USING (true);
CREATE POLICY "owner_insert_entries" ON entries FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = entries.profile_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "owner_update_entries" ON entries FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = entries.profile_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "owner_delete_entries" ON entries FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = entries.profile_id AND p.user_id = auth.uid()
  )
);

-- 3) Quran progress
DROP POLICY IF EXISTS "public_upsert_quran_progress" ON quran_progress;
DROP POLICY IF EXISTS "public_update_quran_progress" ON quran_progress;
DROP POLICY IF EXISTS "public_read_quran_progress" ON quran_progress;
CREATE POLICY "public_read_quran_progress" ON quran_progress FOR SELECT USING (true);
CREATE POLICY "owner_insert_quran_progress" ON quran_progress FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = quran_progress.profile_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "owner_update_quran_progress" ON quran_progress FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = quran_progress.profile_id AND p.user_id = auth.uid()
  )
);

-- 4) Dhikr progress
DROP POLICY IF EXISTS "public_upsert_dhikr_progress" ON dhikr_progress;
DROP POLICY IF EXISTS "public_update_dhikr_progress" ON dhikr_progress;
DROP POLICY IF EXISTS "public_read_dhikr_progress" ON dhikr_progress;
CREATE POLICY "public_read_dhikr_progress" ON dhikr_progress FOR SELECT USING (true);
CREATE POLICY "owner_insert_dhikr_progress" ON dhikr_progress FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = dhikr_progress.profile_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "owner_update_dhikr_progress" ON dhikr_progress FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = dhikr_progress.profile_id AND p.user_id = auth.uid()
  )
);

-- Other tables that should remain publicly readable but not writable by default:
-- prayer_times, qibla_directions, islamic_events keep existing read-only policies


