-- Add 3RM columns to profiles for SFAS program compatibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bench_3rm integer,
ADD COLUMN IF NOT EXISTS deadlift_3rm integer,
ADD COLUMN IF NOT EXISTS squat_3rm integer;

-- Add comment explaining the columns
COMMENT ON COLUMN public.profiles.bench_3rm IS '3 rep max for bench press in lbs';
COMMENT ON COLUMN public.profiles.deadlift_3rm IS '3 rep max for deadlift in lbs';
COMMENT ON COLUMN public.profiles.squat_3rm IS '3 rep max for back squat in lbs';