-- =============================================
-- DEEN TRACKER - COMPREHENSIVE DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Profiles (people)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Entries (one row per person per date)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  
  -- Prayer tracking
  fajr BOOLEAN NOT NULL DEFAULT FALSE,
  dhuhr BOOLEAN NOT NULL DEFAULT FALSE,
  asr BOOLEAN NOT NULL DEFAULT FALSE,
  maghrib BOOLEAN NOT NULL DEFAULT FALSE,
  isha BOOLEAN NOT NULL DEFAULT FALSE,
  tahajjud BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Dhikr tracking
  morning_dhikr BOOLEAN NOT NULL DEFAULT FALSE,
  evening_dhikr BOOLEAN NOT NULL DEFAULT FALSE,
  before_sleep_dhikr BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Quran tracking
  yaseen_after_fajr BOOLEAN NOT NULL DEFAULT FALSE,
  mulk_before_sleep BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Counters
  istighfar_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps for prayers
  fajr_at TIMESTAMPTZ,
  dhuhr_at TIMESTAMPTZ,
  asr_at TIMESTAMPTZ,
  maghrib_at TIMESTAMPTZ,
  isha_at TIMESTAMPTZ,
  tahajjud_at TIMESTAMPTZ,
  morning_dhikr_at TIMESTAMPTZ,
  evening_dhikr_at TIMESTAMPTZ,
  sleep_dhikr_at TIMESTAMPTZ,
  
  -- Metadata
  updated_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, day)
);

-- =============================================
-- ISLAMIC FEATURES TABLES
-- =============================================

-- Quran Reading Progress
CREATE TABLE IF NOT EXISTS quran_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pages_read INTEGER NOT NULL DEFAULT 0,
  verses_read INTEGER NOT NULL DEFAULT 0,
  surahs_completed INTEGER[] DEFAULT '{}',
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, date)
);

-- Dhikr Tracking
CREATE TABLE IF NOT EXISTS dhikr_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Dhikr counts
  tasbih_count INTEGER NOT NULL DEFAULT 0,
  tahmid_count INTEGER NOT NULL DEFAULT 0,
  takbir_count INTEGER NOT NULL DEFAULT 0,
  istighfar_count INTEGER NOT NULL DEFAULT 0,
  salawat_count INTEGER NOT NULL DEFAULT 0,
  lailaha_count INTEGER NOT NULL DEFAULT 0,
  
  -- Additional dhikr
  custom_dhikr JSONB DEFAULT '{}',
  
  total_count INTEGER GENERATED ALWAYS AS (
    tasbih_count + tahmid_count + takbir_count + 
    istighfar_count + salawat_count + lailaha_count
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, date)
);

-- Prayer Times (cached for location)
CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  date DATE NOT NULL,
  fajr TIME NOT NULL,
  dhuhr TIME NOT NULL,
  asr TIME NOT NULL,
  maghrib TIME NOT NULL,
  isha TIME NOT NULL,
  calculation_method TEXT DEFAULT 'Umm al-Qura',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(latitude, longitude, date)
);

-- Qibla Directions (cached for location)
CREATE TABLE IF NOT EXISTS qibla_directions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  direction_degrees DECIMAL(6, 2) NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(latitude, longitude)
);

-- Islamic Calendar Events
CREATE TABLE IF NOT EXISTS islamic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hijri_date TEXT NOT NULL, -- Format: "month-day" e.g., "9-1" for Ramadan 1st
  gregorian_date DATE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'holiday', 'observance', 'celebration', 'fasting', 'special'
  description TEXT,
  is_recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fasting Records
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fast_type TEXT NOT NULL, -- 'ramadan', 'voluntary', 'nafl', 'kafarah', 'nazar'
  status TEXT NOT NULL, -- 'completed', 'missed', 'exempt', 'invalid'
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, date, fast_type)
);

-- =============================================
-- ANALYTICS & TRACKING TABLES
-- =============================================

-- Daily Analytics Summary
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Prayer analytics
  prayers_completed INTEGER NOT NULL DEFAULT 0,
  prayers_total INTEGER NOT NULL DEFAULT 5,
  prayer_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN prayers_total > 0 THEN (prayers_completed::DECIMAL / prayers_total) * 100 ELSE 0 END
  ) STORED,
  
  -- Dhikr analytics
  dhikr_total INTEGER NOT NULL DEFAULT 0,
  dhikr_goal INTEGER NOT NULL DEFAULT 100,
  dhikr_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN dhikr_goal > 0 THEN (dhikr_total::DECIMAL / dhikr_goal) * 100 ELSE 0 END
  ) STORED,
  
  -- Quran analytics
  quran_pages INTEGER NOT NULL DEFAULT 0,
  quran_verses INTEGER NOT NULL DEFAULT 0,
  quran_goal_pages INTEGER NOT NULL DEFAULT 1,
  quran_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN quran_goal_pages > 0 THEN (quran_pages::DECIMAL / quran_goal_pages) * 100 ELSE 0 END
  ) STORED,
  
  -- Overall score (calculated in application layer)
  overall_score DECIMAL(5, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, date)
);

-- Streaks Tracking
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'prayer', 'dhikr', 'quran', 'fasting'
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, streak_type)
);

-- Goals and Targets
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'daily_prayers', 'daily_dhikr', 'weekly_quran', 'monthly_fasting'
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE,
  is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements and Badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'perfect_day', 'dhikr_master', 'quran_reader', etc.
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- FRIENDS SYSTEM
-- =============================================

-- Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'blocked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate requests
  UNIQUE(requester_id, receiver_id),
  -- Ensure requester and receiver are different
  CHECK (requester_id != receiver_id)
);

-- Indexes for friend requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester_status ON friend_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_friend_requests_timestamp
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_entries_profile_date ON entries(profile_id, day);
CREATE INDEX IF NOT EXISTS idx_entries_day ON entries(day);

-- Islamic features indexes
CREATE INDEX IF NOT EXISTS idx_quran_progress_profile_date ON quran_progress(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_dhikr_progress_profile_date ON dhikr_progress(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_prayer_times_location_date ON prayer_times(latitude, longitude, date);
CREATE INDEX IF NOT EXISTS idx_qibla_directions_location ON qibla_directions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fasting_records_profile_date ON fasting_records(profile_id, date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_analytics_profile_date ON daily_analytics(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_streaks_profile_type ON streaks(profile_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_goals_profile_type ON goals(profile_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_achievements_profile_type ON achievements(profile_id, achievement_type);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update daily analytics when entries change
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
  prayer_completion_rate DECIMAL(5, 2);
  dhikr_completion_rate DECIMAL(5, 2);
  quran_completion_rate DECIMAL(5, 2);
  overall_score DECIMAL(5, 2);
BEGIN
  -- Calculate prayer completion rate
  prayer_completion_rate := ((CASE WHEN NEW.fajr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.dhuhr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.asr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.maghrib THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.isha THEN 1 ELSE 0 END)) * 20.0; -- 5 prayers = 100%
  
  -- Calculate dhikr completion rate (assuming 100 dhikr as goal)
  dhikr_completion_rate := LEAST((NEW.istighfar_count::DECIMAL / 100.0) * 100.0, 100.0);
  
  -- Calculate overall score
  overall_score := (prayer_completion_rate + dhikr_completion_rate) / 2.0;
  
  INSERT INTO daily_analytics (
    profile_id, date, prayers_completed, prayers_total, 
    prayer_completion_rate, dhikr_total, dhikr_completion_rate, 
    quran_pages, quran_verses, quran_completion_rate, overall_score
  )
  VALUES (
    NEW.profile_id,
    NEW.day,
    (CASE WHEN NEW.fajr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.dhuhr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.asr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.maghrib THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.isha THEN 1 ELSE 0 END),
    5,
    prayer_completion_rate,
    NEW.istighfar_count,
    dhikr_completion_rate,
    0, -- Will be updated by quran_progress trigger
    0, -- Will be updated by quran_progress trigger
    0, -- Will be updated by quran_progress trigger
    overall_score
  )
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    prayers_completed = EXCLUDED.prayers_completed,
    prayers_total = EXCLUDED.prayers_total,
    prayer_completion_rate = EXCLUDED.prayer_completion_rate,
    dhikr_total = EXCLUDED.dhikr_total,
    dhikr_completion_rate = EXCLUDED.dhikr_completion_rate,
    overall_score = EXCLUDED.overall_score,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for entries table
CREATE TRIGGER trigger_update_daily_analytics_entries
  AFTER INSERT OR UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics();

-- Function to update daily analytics when dhikr progress changes
CREATE OR REPLACE FUNCTION update_daily_analytics_dhikr()
RETURNS TRIGGER AS $$
DECLARE
  dhikr_completion_rate DECIMAL(5, 2);
  overall_score DECIMAL(5, 2);
  existing_prayer_rate DECIMAL(5, 2);
  existing_quran_rate DECIMAL(5, 2);
BEGIN
  -- Calculate dhikr completion rate (assuming 100 dhikr as goal)
  dhikr_completion_rate := LEAST((NEW.total_count::DECIMAL / 100.0) * 100.0, 100.0);
  
  -- Get existing rates to calculate overall score
  SELECT prayer_completion_rate, quran_completion_rate 
  INTO existing_prayer_rate, existing_quran_rate
  FROM daily_analytics 
  WHERE profile_id = NEW.profile_id AND date = NEW.date;
  
  -- Calculate overall score
  overall_score := (COALESCE(existing_prayer_rate, 0) + dhikr_completion_rate + COALESCE(existing_quran_rate, 0)) / 3.0;
  
  INSERT INTO daily_analytics (profile_id, date, dhikr_total, dhikr_completion_rate, overall_score)
  VALUES (NEW.profile_id, NEW.date, NEW.total_count, dhikr_completion_rate, overall_score)
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    dhikr_total = EXCLUDED.dhikr_total,
    dhikr_completion_rate = EXCLUDED.dhikr_completion_rate,
    overall_score = EXCLUDED.overall_score,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dhikr_progress table
CREATE TRIGGER trigger_update_daily_analytics_dhikr
  AFTER INSERT OR UPDATE ON dhikr_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics_dhikr();

-- Function to update daily analytics when quran progress changes
CREATE OR REPLACE FUNCTION update_daily_analytics_quran()
RETURNS TRIGGER AS $$
DECLARE
  quran_completion_rate DECIMAL(5, 2);
  overall_score DECIMAL(5, 2);
  existing_prayer_rate DECIMAL(5, 2);
  existing_dhikr_rate DECIMAL(5, 2);
BEGIN
  -- Calculate quran completion rate (assuming 1 page as goal)
  quran_completion_rate := LEAST((NEW.pages_read::DECIMAL / 1.0) * 100.0, 100.0);
  
  -- Get existing rates to calculate overall score
  SELECT prayer_completion_rate, dhikr_completion_rate 
  INTO existing_prayer_rate, existing_dhikr_rate
  FROM daily_analytics 
  WHERE profile_id = NEW.profile_id AND date = NEW.date;
  
  -- Calculate overall score
  overall_score := (COALESCE(existing_prayer_rate, 0) + COALESCE(existing_dhikr_rate, 0) + quran_completion_rate) / 3.0;
  
  INSERT INTO daily_analytics (profile_id, date, quran_pages, quran_verses, quran_completion_rate, overall_score)
  VALUES (NEW.profile_id, NEW.date, NEW.pages_read, NEW.verses_read, quran_completion_rate, overall_score)
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    quran_pages = EXCLUDED.quran_pages,
    quran_verses = EXCLUDED.quran_verses,
    quran_completion_rate = EXCLUDED.quran_completion_rate,
    overall_score = EXCLUDED.overall_score,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quran_progress table
CREATE TRIGGER trigger_update_daily_analytics_quran
  AFTER INSERT OR UPDATE ON quran_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics_quran();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample Islamic events
INSERT INTO islamic_events (hijri_date, event_name, event_type, description) VALUES
('1-1', 'Islamic New Year', 'holiday', 'First day of Muharram'),
('1-10', 'Day of Ashura', 'observance', 'Commemoration of the martyrdom of Imam Hussain'),
('3-12', 'Mawlid an-Nabi', 'celebration', 'Birth of Prophet Muhammad (PBUH)'),
('7-27', 'Laylat al-Mi''raj', 'observance', 'Night Journey and Ascension'),
('8-15', 'Laylat al-Bara''ah', 'observance', 'Night of Forgiveness'),
('9-1', 'First day of Ramadan', 'fasting', 'Beginning of the holy month of Ramadan'),
('9-27', 'Laylat al-Qadr', 'special', 'Night of Power'),
('10-1', 'Eid al-Fitr', 'holiday', 'Festival of Breaking the Fast'),
('12-8', 'Day of Arafah', 'pilgrimage', 'Day of Arafah during Hajj'),
('12-9', 'Eid al-Adha', 'holiday', 'Festival of Sacrifice'),
('12-10', 'Eid al-Adha (Day 2)', 'holiday', 'Second day of Eid al-Adha')
ON CONFLICT DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dhikr_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE qibla_directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE islamic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for MVP - can be restricted later)
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "public_insert_profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "public_delete_profiles" ON profiles FOR DELETE USING (true);

CREATE POLICY "public_read_entries" ON entries FOR SELECT USING (true);
CREATE POLICY "public_upsert_entries" ON entries FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_entries" ON entries FOR UPDATE USING (true);
CREATE POLICY "public_delete_entries" ON entries FOR DELETE USING (true);

CREATE POLICY "public_read_quran_progress" ON quran_progress FOR SELECT USING (true);
CREATE POLICY "public_upsert_quran_progress" ON quran_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_quran_progress" ON quran_progress FOR UPDATE USING (true);

CREATE POLICY "public_read_dhikr_progress" ON dhikr_progress FOR SELECT USING (true);
CREATE POLICY "public_upsert_dhikr_progress" ON dhikr_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_dhikr_progress" ON dhikr_progress FOR UPDATE USING (true);

CREATE POLICY "public_read_prayer_times" ON prayer_times FOR SELECT USING (true);
CREATE POLICY "public_insert_prayer_times" ON prayer_times FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_qibla_directions" ON qibla_directions FOR SELECT USING (true);
CREATE POLICY "public_insert_qibla_directions" ON qibla_directions FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_islamic_events" ON islamic_events FOR SELECT USING (true);

CREATE POLICY "public_read_fasting_records" ON fasting_records FOR SELECT USING (true);
CREATE POLICY "public_upsert_fasting_records" ON fasting_records FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_fasting_records" ON fasting_records FOR UPDATE USING (true);

CREATE POLICY "public_read_daily_analytics" ON daily_analytics FOR SELECT USING (true);
CREATE POLICY "public_upsert_daily_analytics" ON daily_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_daily_analytics" ON daily_analytics FOR UPDATE USING (true);

CREATE POLICY "public_read_streaks" ON streaks FOR SELECT USING (true);
CREATE POLICY "public_upsert_streaks" ON streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_streaks" ON streaks FOR UPDATE USING (true);

CREATE POLICY "public_read_goals" ON goals FOR SELECT USING (true);
CREATE POLICY "public_upsert_goals" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_goals" ON goals FOR UPDATE USING (true);

CREATE POLICY "public_read_achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "public_insert_achievements" ON achievements FOR INSERT WITH CHECK (true);

-- =============================================
-- VIEWS FOR EASY QUERYING
-- =============================================

-- View for comprehensive daily progress
CREATE OR REPLACE VIEW daily_progress_view AS
SELECT 
  p.id as profile_id,
  p.name as profile_name,
  e.day,
  e.fajr, e.dhuhr, e.asr, e.maghrib, e.isha, e.tahajjud,
  e.morning_dhikr, e.evening_dhikr, e.before_sleep_dhikr,
  e.yaseen_after_fajr, e.mulk_before_sleep,
  e.istighfar_count,
  qp.pages_read, qp.verses_read,
  dp.tasbih_count, dp.tahmid_count, dp.takbir_count,
  dp.salawat_count, dp.lailaha_count, dp.total_count as dhikr_total,
  da.prayer_completion_rate, da.dhikr_completion_rate, da.quran_completion_rate, da.overall_score
FROM profiles p
LEFT JOIN entries e ON p.id = e.profile_id
LEFT JOIN quran_progress qp ON p.id = qp.profile_id AND e.day = qp.date
LEFT JOIN dhikr_progress dp ON p.id = dp.profile_id AND e.day = dp.date
LEFT JOIN daily_analytics da ON p.id = da.profile_id AND e.day = da.date;

-- View for streak summaries
CREATE OR REPLACE VIEW streak_summary_view AS
SELECT 
  p.id as profile_id,
  p.name as profile_name,
  s.streak_type,
  s.current_streak,
  s.longest_streak,
  s.last_activity_date,
  s.is_active
FROM profiles p
LEFT JOIN streaks s ON p.id = s.profile_id;

-- =============================================
-- FUNCTIONS FOR ANALYTICS
-- =============================================

-- Function to calculate prayer streak
CREATE OR REPLACE FUNCTION calculate_prayer_streak(profile_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := target_date;
  day_prayers INTEGER;
BEGIN
  LOOP
    SELECT COUNT(*) INTO day_prayers
    FROM entries 
    WHERE profile_id = profile_uuid 
      AND day = check_date 
      AND (fajr OR dhuhr OR asr OR maghrib OR isha);
    
    IF day_prayers >= 3 THEN -- At least 3 prayers per day
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate dhikr streak
CREATE OR REPLACE FUNCTION calculate_dhikr_streak(profile_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := target_date;
  day_dhikr INTEGER;
BEGIN
  LOOP
    SELECT COALESCE(total_count, 0) INTO day_dhikr
    FROM dhikr_progress 
    WHERE profile_id = profile_uuid AND date = check_date;
    
    IF day_dhikr >= 50 THEN -- At least 50 dhikr per day
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quran streak
CREATE OR REPLACE FUNCTION calculate_quran_streak(profile_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := target_date;
  day_pages INTEGER;
BEGIN
  LOOP
    SELECT COALESCE(pages_read, 0) INTO day_pages
    FROM quran_progress 
    WHERE profile_id = profile_uuid AND date = check_date;
    
    IF day_pages >= 1 THEN -- At least 1 page per day
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;
