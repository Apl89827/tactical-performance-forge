-- Fix materialized view security by revoking public access
-- Remove default public access
REVOKE ALL ON public.user_performance_summary FROM anon, authenticated;

-- Grant select to postgres role only
GRANT SELECT ON public.user_performance_summary TO postgres;

-- Create secure view function for users to access their own data
CREATE OR REPLACE FUNCTION public.get_user_performance(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  total_workouts_completed bigint,
  total_training_days bigint,
  last_workout_date timestamp with time zone,
  total_volume_lbs numeric,
  avg_rpe numeric,
  latest_pushups integer,
  latest_situps integer,
  latest_pullups integer,
  latest_run_time text,
  bench_5rm integer,
  squat_5rm integer,
  deadlift_5rm integer,
  bodyweight integer,
  selection_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and coaches can view any user's data
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach') THEN
    RETURN QUERY
    SELECT * FROM public.user_performance_summary
    WHERE (target_user_id IS NULL OR user_performance_summary.user_id = target_user_id);
  -- Regular users can only view their own data
  ELSE
    RETURN QUERY
    SELECT * FROM public.user_performance_summary
    WHERE user_performance_summary.user_id = COALESCE(target_user_id, auth.uid());
  END IF;
END;
$$;