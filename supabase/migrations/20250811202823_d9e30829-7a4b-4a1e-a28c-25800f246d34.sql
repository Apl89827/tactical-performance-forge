-- Phase 1: Core schema for scheduling, logging, and auditing
-- 0) Helpers: update_updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) user_scheduled_workouts: planned daily workouts per user
CREATE TABLE IF NOT EXISTS public.user_scheduled_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NULL,
  date date NOT NULL,
  title text NOT NULL,
  day_type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  source text NULL DEFAULT 'generator',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_scheduled_workouts' AND policyname = 'Admins can manage all scheduled workouts'
  ) THEN
    CREATE POLICY "Admins can manage all scheduled workouts"
    ON public.user_scheduled_workouts
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Users can view own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_scheduled_workouts' AND policyname = 'Users can view own scheduled workouts'
  ) THEN
    CREATE POLICY "Users can view own scheduled workouts"
    ON public.user_scheduled_workouts
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_scheduled_workouts' AND policyname = 'Users can insert own scheduled workouts'
  ) THEN
    CREATE POLICY "Users can insert own scheduled workouts"
    ON public.user_scheduled_workouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_scheduled_workouts' AND policyname = 'Users can update own scheduled workouts'
  ) THEN
    CREATE POLICY "Users can update own scheduled workouts"
    ON public.user_scheduled_workouts
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_scheduled_workouts' AND policyname = 'Users can delete own scheduled workouts'
  ) THEN
    CREATE POLICY "Users can delete own scheduled workouts"
    ON public.user_scheduled_workouts
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_scheduled_workouts_user_date ON public.user_scheduled_workouts (user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_scheduled_workouts_program ON public.user_scheduled_workouts (program_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_user_scheduled_workouts_updated_at ON public.user_scheduled_workouts;
CREATE TRIGGER trg_user_scheduled_workouts_updated_at
BEFORE UPDATE ON public.user_scheduled_workouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) user_workout_logs: one log per workout session
CREATE TABLE IF NOT EXISTS public.user_workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_workout_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  notes text NULL,
  rpe integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_workout_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_workout_logs' AND policyname = 'Admins can manage all workout logs'
  ) THEN
    CREATE POLICY "Admins can manage all workout logs"
    ON public.user_workout_logs
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Users can view own via scheduled_workout ownership
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_workout_logs' AND policyname = 'Users can view own workout logs'
  ) THEN
    CREATE POLICY "Users can view own workout logs"
    ON public.user_workout_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_scheduled_workouts sw
        WHERE sw.id = scheduled_workout_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Users can insert own (must own the scheduled workout)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_workout_logs' AND policyname = 'Users can insert own workout logs'
  ) THEN
    CREATE POLICY "Users can insert own workout logs"
    ON public.user_workout_logs
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_scheduled_workouts sw
        WHERE sw.id = scheduled_workout_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Users can update own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_workout_logs' AND policyname = 'Users can update own workout logs'
  ) THEN
    CREATE POLICY "Users can update own workout logs"
    ON public.user_workout_logs
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_scheduled_workouts sw
        WHERE sw.id = scheduled_workout_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Users can delete own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_workout_logs' AND policyname = 'Users can delete own workout logs'
  ) THEN
    CREATE POLICY "Users can delete own workout logs"
    ON public.user_workout_logs
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_scheduled_workouts sw
        WHERE sw.id = scheduled_workout_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_workout_logs_scheduled ON public.user_workout_logs (scheduled_workout_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_user_workout_logs_updated_at ON public.user_workout_logs;
CREATE TRIGGER trg_user_workout_logs_updated_at
BEFORE UPDATE ON public.user_workout_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3) user_set_logs: per-set results
CREATE TABLE IF NOT EXISTS public.user_set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid NOT NULL,
  exercise_index integer NOT NULL,
  set_number integer NOT NULL,
  target_reps integer NULL,
  target_weight numeric NULL,
  actual_reps integer NULL,
  actual_weight numeric NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_set_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_set_logs' AND policyname = 'Admins can manage all set logs'
  ) THEN
    CREATE POLICY "Admins can manage all set logs"
    ON public.user_set_logs
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Users can view/insert/update/delete own via workout_log -> scheduled_workout ownership
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_set_logs' AND policyname = 'Users can view own set logs'
  ) THEN
    CREATE POLICY "Users can view own set logs"
    ON public.user_set_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_workout_logs wl
        JOIN public.user_scheduled_workouts sw ON sw.id = wl.scheduled_workout_id
        WHERE wl.id = workout_log_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_set_logs' AND policyname = 'Users can insert own set logs'
  ) THEN
    CREATE POLICY "Users can insert own set logs"
    ON public.user_set_logs
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_workout_logs wl
        JOIN public.user_scheduled_workouts sw ON sw.id = wl.scheduled_workout_id
        WHERE wl.id = workout_log_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_set_logs' AND policyname = 'Users can update own set logs'
  ) THEN
    CREATE POLICY "Users can update own set logs"
    ON public.user_set_logs
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_workout_logs wl
        JOIN public.user_scheduled_workouts sw ON sw.id = wl.scheduled_workout_id
        WHERE wl.id = workout_log_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_set_logs' AND policyname = 'Users can delete own set logs'
  ) THEN
    CREATE POLICY "Users can delete own set logs"
    ON public.user_set_logs
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_workout_logs wl
        JOIN public.user_scheduled_workouts sw ON sw.id = wl.scheduled_workout_id
        WHERE wl.id = workout_log_id AND sw.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_set_logs_workout_log ON public.user_set_logs (workout_log_id);
CREATE INDEX IF NOT EXISTS idx_user_set_logs_lookup ON public.user_set_logs (workout_log_id, exercise_index, set_number);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_user_set_logs_updated_at ON public.user_set_logs;
CREATE TRIGGER trg_user_set_logs_updated_at
BEFORE UPDATE ON public.user_set_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4) Audit logs table and triggers for admin-managed tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NULL,
  action text NOT NULL,
  old_data jsonb NULL,
  new_data jsonb NULL,
  changed_by uuid NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
  ) THEN
    CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- No direct insert/update/delete by clients (no policies) — only via SECURITY DEFINER function

-- Function to write audit entries (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.write_audit_entry(
  _table text,
  _record uuid,
  _action text,
  _old jsonb,
  _new jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (_table, _record, _action, _old, _new, auth.uid());
END;
$$;

-- Generic trigger function to audit row changes
CREATE OR REPLACE FUNCTION public.audit_row_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_id := COALESCE((to_jsonb(OLD)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach audit triggers to admin-managed tables
DO $$ BEGIN
  -- content
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_content'
  ) THEN
    CREATE TRIGGER trg_audit_content
    AFTER INSERT OR UPDATE OR DELETE ON public.content
    FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();
  END IF;
  -- workout_programs
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_workout_programs'
  ) THEN
    CREATE TRIGGER trg_audit_workout_programs
    AFTER INSERT OR UPDATE OR DELETE ON public.workout_programs
    FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();
  END IF;
  -- workout_exercises
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_workout_exercises'
  ) THEN
    CREATE TRIGGER trg_audit_workout_exercises
    AFTER INSERT OR UPDATE OR DELETE ON public.workout_exercises
    FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();
  END IF;
  -- user_program_assignments
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_user_program_assignments'
  ) THEN
    CREATE TRIGGER trg_audit_user_program_assignments
    AFTER INSERT OR UPDATE OR DELETE ON public.user_program_assignments
    FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();
  END IF;
END $$;

-- Helpful indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs (changed_at DESC);
