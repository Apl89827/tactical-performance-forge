-- Phase 1: Data model corrections + PT metrics

-- 1) Add bodyweight percentage fields to workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS is_bodyweight_percentage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bodyweight_percentage integer NULL;

-- Optional sanity check constraint (non-immutable/time-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_workout_exercises_bodyweight_percentage_range'
  ) THEN
    ALTER TABLE public.workout_exercises
      ADD CONSTRAINT chk_workout_exercises_bodyweight_percentage_range
      CHECK (bodyweight_percentage IS NULL OR (bodyweight_percentage >= 1 AND bodyweight_percentage <= 200));
  END IF;
END $$;

-- 2) Create pt_metrics table for baseline/ongoing PT metrics
CREATE TABLE IF NOT EXISTS public.pt_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  run_time text,
  pushups integer,
  situps integer,
  pullups integer,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pt_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pt_metrics' AND policyname='Users can insert own pt metrics'
  ) THEN
    CREATE POLICY "Users can insert own pt metrics"
    ON public.pt_metrics FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pt_metrics' AND policyname='Users can view own pt metrics'
  ) THEN
    CREATE POLICY "Users can view own pt metrics"
    ON public.pt_metrics FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pt_metrics' AND policyname='Users can update own pt metrics'
  ) THEN
    CREATE POLICY "Users can update own pt metrics"
    ON public.pt_metrics FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pt_metrics' AND policyname='Users can delete own pt metrics'
  ) THEN
    CREATE POLICY "Users can delete own pt metrics"
    ON public.pt_metrics FOR DELETE TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pt_metrics' AND policyname='Admins can view all pt metrics'
  ) THEN
    CREATE POLICY "Admins can view all pt metrics"
    ON public.pt_metrics FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;