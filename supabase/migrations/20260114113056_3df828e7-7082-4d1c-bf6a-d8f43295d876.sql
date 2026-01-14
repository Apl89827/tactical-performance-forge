-- Add exercise_type to movement_library to distinguish strength vs cardio exercises
ALTER TABLE public.movement_library 
ADD COLUMN IF NOT EXISTS exercise_type TEXT DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'plyometric', 'mobility'));

-- Add distance and time columns to workout_exercises for cardio exercises
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS distance NUMERIC,
ADD COLUMN IF NOT EXISTS distance_unit TEXT CHECK (distance_unit IN ('miles', 'meters', 'km')),
ADD COLUMN IF NOT EXISTS target_time TEXT,
ADD COLUMN IF NOT EXISTS target_pace TEXT;

-- Add distance and time columns to user_set_logs for logging cardio data
ALTER TABLE public.user_set_logs
ADD COLUMN IF NOT EXISTS target_distance NUMERIC,
ADD COLUMN IF NOT EXISTS actual_distance NUMERIC,
ADD COLUMN IF NOT EXISTS distance_unit TEXT CHECK (distance_unit IN ('miles', 'meters', 'km')),
ADD COLUMN IF NOT EXISTS target_time TEXT,
ADD COLUMN IF NOT EXISTS actual_time TEXT;

-- Add 'cardio' category to movement_library if it doesn't exist
-- (Categories are just text values, no enum needed)

-- Create some common running/cardio movements
INSERT INTO public.movement_library (name, category, subcategory, exercise_type, description)
VALUES 
  ('2 Mile Run', 'cardio', 'running', 'cardio', 'Standard 2 mile run for time'),
  ('1.5 Mile Run', 'cardio', 'running', 'cardio', 'APFT/ACFT standard 1.5 mile run'),
  ('400m Repeats', 'cardio', 'running', 'cardio', 'Sprint intervals on a track'),
  ('800m Repeats', 'cardio', 'running', 'cardio', 'Half-mile interval training'),
  ('Ruck March', 'cardio', 'rucking', 'cardio', 'Weighted ruck march for distance'),
  ('Sprint Intervals', 'cardio', 'running', 'cardio', 'High intensity sprint training'),
  ('Tempo Run', 'cardio', 'running', 'cardio', 'Sustained pace running'),
  ('Recovery Run', 'cardio', 'running', 'cardio', 'Easy pace recovery run'),
  ('Hill Repeats', 'cardio', 'running', 'cardio', 'Hill sprint intervals'),
  ('Shuttle Run', 'cardio', 'running', 'cardio', 'Agility shuttle run drill')
ON CONFLICT (name) DO UPDATE SET 
  exercise_type = EXCLUDED.exercise_type,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory;