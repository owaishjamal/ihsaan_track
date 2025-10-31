-- Fix triggers to avoid writing to generated columns in daily_analytics

-- Drop and recreate function update_daily_analytics without generated columns in DML
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
  prayers_completed INTEGER;
  dhikr_total INTEGER;
  overall_score DECIMAL(5, 2);
BEGIN
  prayers_completed := (CASE WHEN NEW.fajr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.dhuhr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.asr THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.maghrib THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.isha THEN 1 ELSE 0 END);

  dhikr_total := NEW.istighfar_count;

  -- Compute overall_score in app or recompute here using non-generated inputs
  overall_score := 0; -- leave to be recomputed elsewhere

  INSERT INTO daily_analytics (
    profile_id, date, prayers_completed, prayers_total, dhikr_total, overall_score
  )
  VALUES (
    NEW.profile_id,
    NEW.day,
    prayers_completed,
    5,
    dhikr_total,
    overall_score
  )
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    prayers_completed = EXCLUDED.prayers_completed,
    prayers_total = EXCLUDED.prayers_total,
    dhikr_total = EXCLUDED.dhikr_total,
    overall_score = EXCLUDED.overall_score,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate function update_daily_analytics_dhikr without generated columns
CREATE OR REPLACE FUNCTION update_daily_analytics_dhikr()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_analytics (profile_id, date, dhikr_total)
  VALUES (NEW.profile_id, NEW.date, NEW.total_count)
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    dhikr_total = EXCLUDED.dhikr_total,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate function update_daily_analytics_quran without generated columns
CREATE OR REPLACE FUNCTION update_daily_analytics_quran()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_analytics (profile_id, date, quran_pages, quran_verses)
  VALUES (NEW.profile_id, NEW.date, NEW.pages_read, NEW.verses_read)
  ON CONFLICT (profile_id, date) 
  DO UPDATE SET
    quran_pages = EXCLUDED.quran_pages,
    quran_verses = EXCLUDED.quran_verses,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


