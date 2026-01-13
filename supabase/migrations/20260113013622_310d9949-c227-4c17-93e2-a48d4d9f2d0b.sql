-- Add program metadata columns to workout_programs
ALTER TABLE public.workout_programs
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS days_per_week INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT 'strength';

-- Add week/day columns to workout_exercises for periodized programs  
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 1;

-- Add active program tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_program_id UUID REFERENCES public.workout_programs(id),
ADD COLUMN IF NOT EXISTS program_start_date DATE,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '06:00:00';

-- Allow users to insert their own program assignments (for self-selection)
CREATE POLICY "Users can insert own program assignments" 
ON public.user_program_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own program assignments
CREATE POLICY "Users can update own program assignments" 
ON public.user_program_assignments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add week_number to user_scheduled_workouts for tracking program progress
ALTER TABLE public.user_scheduled_workouts
ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 1;