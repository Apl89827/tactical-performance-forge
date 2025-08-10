
-- 1) program_workouts: one row per day/session under a program
create table if not exists public.program_workouts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  day integer not null,
  name text not null,
  header text,
  session_type text,
  notes text,
  -- External reference from your JSON (e.g., "wo_hyp_01")
  external_id text unique,
  created_at timestamptz not null default now(),
  constraint uq_program_day unique (program_id, day)
);

-- RLS
alter table public.program_workouts enable row level security;

-- Admins manage all program workouts
create policy if not exists "Admins can manage all program workouts"
  on public.program_workouts
  as restrictive
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view program workouts (aligns with existing workout_programs)
create policy if not exists "Users can view program workouts"
  on public.program_workouts
  as restrictive
  for select
  using (true);

-- Helpful index for lookups
create index if not exists idx_program_workouts_program_id
  on public.program_workouts (program_id);

create index if not exists idx_program_workouts_program_day
  on public.program_workouts (program_id, day);


-- 2) program_workout_items: ordered list of items for a given workout
create table if not exists public.program_workout_items (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.program_workouts(id) on delete cascade,
  order_position integer not null default 0,
  -- Source references and descriptive fields
  exercise_code text, -- from "exercise_id" in JSON
  movement_name text, -- optional; keep null if not derived
  prescribed text,    -- full prescription text from JSON
  notes text,
  -- Optional BW fields (for future use)
  is_bodyweight_percentage boolean not null default false,
  bodyweight_percentage integer,
  -- Source external identifier if provided
  external_id text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.program_workout_items enable row level security;

-- Admins manage all items
create policy if not exists "Admins can manage all program workout items"
  on public.program_workout_items
  as restrictive
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view program workout items
create policy if not exists "Users can view program workout items"
  on public.program_workout_items
  as restrictive
  for select
  using (true);

-- Indexes
create index if not exists idx_program_workout_items_workout_id
  on public.program_workout_items (workout_id);

create index if not exists idx_program_workout_items_order
  on public.program_workout_items (workout_id, order_position);

-- Ensure no duplicates when re-importing with external_id (if present)
create unique index if not exists uq_program_workout_items_external
  on public.program_workout_items (workout_id, external_id)
  where external_id is not null;
