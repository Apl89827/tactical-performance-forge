-- Add recommendation columns to workout_programs
ALTER TABLE public.workout_programs
ADD COLUMN IF NOT EXISTS recommendation_type text,
ADD COLUMN IF NOT EXISTS recommendation_threshold_metric text,
ADD COLUMN IF NOT EXISTS recommendation_threshold_value text,
ADD COLUMN IF NOT EXISTS recommendation_condition text,
ADD COLUMN IF NOT EXISTS is_addon_program boolean DEFAULT false;

-- Insert Push Up Kicker Program
INSERT INTO public.workout_programs (title, description, program_type, duration_weeks, days_per_week, is_public, recommendation_type, recommendation_threshold_metric, recommendation_threshold_value, recommendation_condition, is_addon_program)
VALUES (
  'Push Up Kicker',
  'Add-on program to boost push-up performance. Features sling shot push-ups, barbell press, accelerated push-ups, smart burpees, and explosive movements. Do 3 blocks per 6-day cycle alongside your main program.',
  'strength',
  8,
  3,
  true,
  'pushup_kicker',
  'pushups',
  '60',
  'below',
  true
) ON CONFLICT DO NOTHING;

-- Insert PST Run Program Phase 2
INSERT INTO public.workout_programs (title, description, program_type, duration_weeks, days_per_week, is_public, recommendation_type, recommendation_threshold_metric, recommendation_threshold_value, recommendation_condition, is_addon_program)
VALUES (
  'PST Run Program',
  'Phase 2 run program for improving 1.5 mile time. 5 weeks of structured interval training with HR-based zones, sprint work, tempo runs, and recovery sessions.',
  'endurance',
  5,
  5,
  true,
  'run_improvement',
  'run_time',
  '10:00',
  'above',
  true
) ON CONFLICT DO NOTHING;

-- Insert Hypertrophy Run Program (companion program, no auto-recommendation)
INSERT INTO public.workout_programs (title, description, program_type, duration_weeks, days_per_week, is_public, is_addon_program)
VALUES (
  'Hypertrophy Run Program',
  'Companion cardio program for hypertrophy training. Low-intensity walks, jogs, ruck marches, bike rides, and rowing to maintain conditioning without interfering with muscle growth.',
  'endurance',
  8,
  4,
  true,
  true
) ON CONFLICT DO NOTHING;