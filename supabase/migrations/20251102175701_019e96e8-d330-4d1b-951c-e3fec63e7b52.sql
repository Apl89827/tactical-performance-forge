-- Phase 1b: Database & Infrastructure for Version 2.0

-- 1. Create movement_library table
CREATE TABLE IF NOT EXISTS public.movement_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL, -- 'max_effort', 'dynamic_effort', 'accessory', 'gpp'
  subcategory text, -- 'upper_push', 'upper_pull', 'squat', 'deadlift', 'posterior_chain', 'trunk'
  description text,
  video_url text,
  form_cues jsonb DEFAULT '[]'::jsonb, -- Array of form tips
  equipment_needed text[],
  difficulty_level text, -- 'beginner', 'intermediate', 'advanced'
  is_bodyweight boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 2. Create program_versions table for version control
CREATE TABLE IF NOT EXISTS public.program_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  description text,
  exercises jsonb NOT NULL, -- Full snapshot of exercises at this version
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  change_notes text,
  UNIQUE(program_id, version_number)
);

-- 3. Create notification_queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- 'workout_reminder', 'pt_test_due', 'coach_message', 'achievement'
  title text NOT NULL,
  message text NOT NULL,
  data jsonb, -- Additional structured data
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create coach_assignments table for coach-athlete relationships
CREATE TABLE IF NOT EXISTS public.coach_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(coach_id, athlete_id)
);

-- 5. Create user_performance_summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_performance_summary AS
SELECT 
  p.id as user_id,
  p.first_name,
  p.last_name,
  -- Workout stats
  COUNT(DISTINCT uwl.id) as total_workouts_completed,
  COUNT(DISTINCT DATE(uwl.completed_at)) as total_training_days,
  MAX(uwl.completed_at) as last_workout_date,
  -- Volume metrics
  SUM(usl.actual_weight * usl.actual_reps) as total_volume_lbs,
  AVG(uwl.rpe) as avg_rpe,
  -- PT metrics (latest)
  (SELECT pushups FROM pt_metrics WHERE user_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_pushups,
  (SELECT situps FROM pt_metrics WHERE user_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_situps,
  (SELECT pullups FROM pt_metrics WHERE user_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_pullups,
  (SELECT run_time FROM pt_metrics WHERE user_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_run_time,
  -- 5RM stats
  p.bench_5rm,
  p.squat_5rm,
  p.deadlift_5rm,
  p.weight as bodyweight,
  -- Selection date
  p.selection_date
FROM public.profiles p
LEFT JOIN public.user_scheduled_workouts usw ON usw.user_id = p.id
LEFT JOIN public.user_workout_logs uwl ON uwl.scheduled_workout_id = usw.id AND uwl.completed_at IS NOT NULL
LEFT JOIN public.user_set_logs usl ON usl.workout_log_id = uwl.id AND usl.completed = true
GROUP BY p.id, p.first_name, p.last_name, p.bench_5rm, p.squat_5rm, p.deadlift_5rm, p.weight, p.selection_date;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS user_performance_summary_user_id_idx ON public.user_performance_summary(user_id);

-- 6. Enable RLS on new tables
ALTER TABLE public.movement_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for movement_library
CREATE POLICY "Anyone can view movement library"
  ON public.movement_library FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage movement library"
  ON public.movement_library FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 8. RLS Policies for program_versions
CREATE POLICY "Anyone can view program versions"
  ON public.program_versions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage program versions"
  ON public.program_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 9. RLS Policies for notification_queue
CREATE POLICY "Users can view their own notifications"
  ON public.notification_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and coaches can insert notifications"
  ON public.notification_queue FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'coach')
  );

CREATE POLICY "Admins can manage all notifications"
  ON public.notification_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 10. RLS Policies for coach_assignments
CREATE POLICY "Coaches can view their assignments"
  ON public.coach_assignments FOR SELECT
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage coach assignments"
  ON public.coach_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 11. Create triggers for updated_at
CREATE TRIGGER update_movement_library_updated_at
  BEFORE UPDATE ON public.movement_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create function to refresh performance summary
CREATE OR REPLACE FUNCTION public.refresh_performance_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_performance_summary;
END;
$$;

-- 13. Backfill movement library with existing exercises
INSERT INTO public.movement_library (name, category, subcategory, is_bodyweight, created_by)
SELECT DISTINCT 
  movement_name,
  CASE 
    WHEN movement_name ILIKE '%squat%' OR movement_name ILIKE '%deadlift%' THEN 'max_effort'
    WHEN movement_name ILIKE '%press%' OR movement_name ILIKE '%bench%' THEN 'max_effort'
    WHEN movement_name ILIKE '%pullup%' OR movement_name ILIKE '%chinup%' THEN 'accessory'
    WHEN movement_name ILIKE '%pushup%' OR movement_name ILIKE '%situp%' THEN 'accessory'
    ELSE 'accessory'
  END as category,
  CASE 
    WHEN movement_name ILIKE '%press%' OR movement_name ILIKE '%bench%' OR movement_name ILIKE '%pushup%' THEN 'upper_push'
    WHEN movement_name ILIKE '%pull%' OR movement_name ILIKE '%row%' THEN 'upper_pull'
    WHEN movement_name ILIKE '%squat%' THEN 'squat'
    WHEN movement_name ILIKE '%deadlift%' THEN 'deadlift'
    WHEN movement_name ILIKE '%hamstring%' OR movement_name ILIKE '%glute%' THEN 'posterior_chain'
    WHEN movement_name ILIKE '%core%' OR movement_name ILIKE '%situp%' OR movement_name ILIKE '%plank%' THEN 'trunk'
    ELSE NULL
  END as subcategory,
  CASE 
    WHEN movement_name ILIKE '%pullup%' OR movement_name ILIKE '%chinup%' OR movement_name ILIKE '%pushup%' OR movement_name ILIKE '%situp%' THEN true
    ELSE false
  END as is_bodyweight,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.workout_exercises
WHERE movement_name IS NOT NULL
ON CONFLICT (name) DO NOTHING;