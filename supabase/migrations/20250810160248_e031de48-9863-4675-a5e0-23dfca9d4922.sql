-- 1) Add persistent onboarding/profile fields to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS focus_type text,
  ADD COLUMN IF NOT EXISTS selection_type text,
  ADD COLUMN IF NOT EXISTS selection_date date,
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;

-- 2) Attach trigger to create profile row automatically on user signup (if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;