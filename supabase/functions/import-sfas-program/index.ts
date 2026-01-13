import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SFAS Program Data extracted from PDF
const SFAS_PROGRAM = {
  title: "SFAS Selection Training Program",
  description: "Special Forces Assessment and Selection preparation program by Jeff Nichols CSCS*D, TSAC*D. Before starting, establish your 3RM values for Back Squat, Bench Press, and Deadlift. Program includes circuit training, percentage-based strength work, and muscular endurance protocols.",
  duration_weeks: 8,
  days_per_week: 6,
  is_public: true,
  program_type: "strength"
};

// All exercises from the PDF organized by week and day
const EXERCISES = [
  // WEEK 1
  // Day 1 - Biceps (Circuit: 30s on/30s off, 90s between rotations, 5 rotations)
  { week: 1, day: 1, movement: "ex_barbell_bicep_curl", sets: 5, reps: 10, order: 1, notes: "Circuit format: 30s on, 30s off. 90s between rotations. 5 rotations total. Pick a challenging weight." },
  { week: 1, day: 1, movement: "ex_cable_hammer_curl", sets: 5, reps: 10, order: 2, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 1, movement: "ex_behind_head_cable_curl", sets: 5, reps: 10, order: 3, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 1, movement: "ex_ez_bar_preacher_curl", sets: 5, reps: 10, order: 4, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 1, movement: "ex_seated_machine_curl", sets: 5, reps: 10, order: 5, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 1, movement: "ex_reverse_grip_ez_curl", sets: 5, reps: 10, order: 6, notes: "Circuit format: 30s on, 30s off." },
  
  // Day 2 - Chest
  { week: 1, day: 2, movement: "ex_barbell_bench_press", sets: 6, reps: 0, order: 1, notes: "90% of 3RM. 6 sets of max reps (AMRAP). Use slingshot if available. Rest 90s-3min between sets.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 1, day: 2, movement: "ex_seated_machine_press", sets: 3, reps: 20, order: 2, notes: "Superset with Chest Dips. Rest 60-90s between supersets.", is_bw_percentage: true, bw_percentage: 67 },
  { week: 1, day: 2, movement: "ex_chest_dips", sets: 3, reps: 0, order: 3, notes: "Max reps. Part of superset with Seated Machine Press." },
  
  // Day 3 - Legs
  { week: 1, day: 3, movement: "ex_front_squat", sets: 4, reps: 8, order: 1, notes: "85% of Back Squat 3RM. Rest 2-3 min between sets.", is_3rm_percentage: true, percentage_3rm: 85 },
  { week: 1, day: 3, movement: "ex_belt_squat", sets: 5, reps: 10, order: 2, notes: "60% of bodyweight for first 3 sets, increase each set until final set is challenging.", is_bw_percentage: true, bw_percentage: 60 },
  { week: 1, day: 3, movement: "ex_rdl", sets: 4, reps: 8, order: 3, notes: "70% of Deadlift 3RM.", is_3rm_percentage: true, percentage_3rm: 70 },
  { week: 1, day: 3, movement: "ex_rear_elevated_split_squat", sets: 3, reps: 10, order: 4, notes: "Each leg. Use DBs or barbell. Focus on depth and control." },
  
  // Day 4 - Triceps (Circuit: 30s on/30s off, 90s between rotations, 5 rotations)
  { week: 1, day: 4, movement: "ex_tricep_pressdown", sets: 5, reps: 10, order: 1, notes: "Circuit format: 30s on, 30s off. 90s between rotations. 5 rotations total." },
  { week: 1, day: 4, movement: "ex_skull_crushers", sets: 5, reps: 10, order: 2, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 4, movement: "ex_cable_overhead_extension", sets: 5, reps: 10, order: 3, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 4, movement: "ex_close_grip_bench_press", sets: 5, reps: 10, order: 4, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 4, movement: "ex_dips", sets: 5, reps: 10, order: 5, notes: "Circuit format: 30s on, 30s off." },
  { week: 1, day: 4, movement: "ex_diamond_push_ups", sets: 5, reps: 10, order: 6, notes: "Circuit format: 30s on, 30s off." },
  
  // Day 5 - Back
  { week: 1, day: 5, movement: "ex_deadlift", sets: 6, reps: 0, order: 1, notes: "90% of 3RM. 6 sets of max reps (AMRAP). Rest 90s-3min between sets.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 1, day: 5, movement: "ex_bent_over_row", sets: 4, reps: 10, order: 2, notes: "Control the negative. Rest 60-90s between sets." },
  { week: 1, day: 5, movement: "ex_pull_ups", sets: 4, reps: 0, order: 3, notes: "Max reps each set. Vary grip each set: wide, neutral, close, chin-up." },
  { week: 1, day: 5, movement: "ex_seated_cable_row", sets: 4, reps: 12, order: 4, notes: "Focus on squeezing shoulder blades together." },
  { week: 1, day: 5, movement: "ex_lat_pulldown", sets: 3, reps: 15, order: 5, notes: "Lighter weight, higher reps for muscular endurance." },
  { week: 1, day: 5, movement: "ex_face_pulls", sets: 3, reps: 20, order: 6, notes: "Focus on external rotation at the end of the movement." },
  
  // Day 6 - Shoulders
  { week: 1, day: 6, movement: "ex_push_press", sets: 5, reps: 5, order: 1, notes: "Use leg drive. 70% of Bench 3RM.", is_3rm_percentage: true, percentage_3rm: 70 },
  { week: 1, day: 6, movement: "ex_muscle_snatch", sets: 4, reps: 6, order: 2, notes: "Focus on technique. Light to moderate weight." },
  { week: 1, day: 6, movement: "ex_db_clean_and_press", sets: 4, reps: 8, order: 3, notes: "Each arm or both together. Explosive movement." },
  { week: 1, day: 6, movement: "ex_db_lateral_raise", sets: 3, reps: 15, order: 4, notes: "Control the movement. Light weight, high reps." },

  // WEEK 2
  // Day 1 - Biceps
  { week: 2, day: 1, movement: "ex_barbell_bicep_curl", sets: 5, reps: 10, order: 1, notes: "Circuit format: 30s on, 30s off. 90s between rotations. Increase weight from Week 1." },
  { week: 2, day: 1, movement: "ex_cable_hammer_curl", sets: 5, reps: 10, order: 2, notes: "Circuit format: 30s on, 30s off." },
  { week: 2, day: 1, movement: "ex_behind_head_cable_curl", sets: 5, reps: 10, order: 3, notes: "Circuit format: 30s on, 30s off." },
  { week: 2, day: 1, movement: "ex_ez_bar_preacher_curl", sets: 5, reps: 10, order: 4, notes: "Circuit format: 30s on, 30s off." },
  { week: 2, day: 1, movement: "ex_seated_machine_curl", sets: 5, reps: 10, order: 5, notes: "Circuit format: 30s on, 30s off." },
  { week: 2, day: 1, movement: "ex_reverse_grip_ez_curl", sets: 5, reps: 10, order: 6, notes: "Circuit format: 30s on, 30s off." },
  
  // Day 2 - Chest
  { week: 2, day: 2, movement: "ex_barbell_bench_press", sets: 6, reps: 0, order: 1, notes: "92% of 3RM. 6 sets of max reps. Progressive overload from Week 1.", is_3rm_percentage: true, percentage_3rm: 92 },
  { week: 2, day: 2, movement: "ex_incline_db_press", sets: 4, reps: 12, order: 2, notes: "Focus on stretch at bottom." },
  { week: 2, day: 2, movement: "ex_cable_flyes", sets: 3, reps: 15, order: 3, notes: "High to low movement pattern." },
  { week: 2, day: 2, movement: "ex_push_ups", sets: 3, reps: 0, order: 4, notes: "Max reps. Burnout set." },
  
  // Day 3 - Legs
  { week: 2, day: 3, movement: "ex_back_squat", sets: 5, reps: 5, order: 1, notes: "88% of 3RM. Focus on depth.", is_3rm_percentage: true, percentage_3rm: 88 },
  { week: 2, day: 3, movement: "ex_hatfield_squat", sets: 4, reps: 10, order: 2, notes: "Use safety squat bar if available. Hold rack for balance." },
  { week: 2, day: 3, movement: "ex_glute_ham_raise", sets: 4, reps: 8, order: 3, notes: "Control the eccentric. Use assistance if needed." },
  { week: 2, day: 3, movement: "ex_leg_press", sets: 3, reps: 15, order: 4, notes: "Feet high and wide for glute emphasis." },
  
  // Day 4 - Triceps
  { week: 2, day: 4, movement: "ex_close_grip_bench_press", sets: 5, reps: 8, order: 1, notes: "75% of Bench 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 2, day: 4, movement: "ex_tricep_pressdown", sets: 4, reps: 12, order: 2, notes: "V-bar or rope attachment." },
  { week: 2, day: 4, movement: "ex_overhead_tricep_extension", sets: 4, reps: 12, order: 3, notes: "Dumbbell or EZ bar." },
  { week: 2, day: 4, movement: "ex_bench_dips", sets: 3, reps: 0, order: 4, notes: "Max reps. Add weight if needed." },
  
  // Day 5 - Back
  { week: 2, day: 5, movement: "ex_deadlift", sets: 5, reps: 5, order: 1, notes: "92% of 3RM. Focus on form.", is_3rm_percentage: true, percentage_3rm: 92 },
  { week: 2, day: 5, movement: "ex_weighted_pull_ups", sets: 4, reps: 6, order: 2, notes: "Add weight via belt or vest." },
  { week: 2, day: 5, movement: "ex_t_bar_row", sets: 4, reps: 10, order: 3, notes: "Keep back flat." },
  { week: 2, day: 5, movement: "ex_single_arm_db_row", sets: 3, reps: 12, order: 4, notes: "Each arm. Focus on lat stretch." },
  { week: 2, day: 5, movement: "ex_straight_arm_pulldown", sets: 3, reps: 15, order: 5, notes: "Keep arms straight, focus on lats." },
  
  // Day 6 - Full Body
  { week: 2, day: 6, movement: "ex_power_clean", sets: 5, reps: 3, order: 1, notes: "Explosive. 70% of Deadlift 3RM.", is_3rm_percentage: true, percentage_3rm: 70 },
  { week: 2, day: 6, movement: "ex_push_press", sets: 4, reps: 6, order: 2, notes: "From the clean position." },
  { week: 2, day: 6, movement: "ex_front_squat", sets: 4, reps: 6, order: 3, notes: "Clean grip if possible." },
  { week: 2, day: 6, movement: "ex_barbell_row", sets: 3, reps: 10, order: 4, notes: "Explosive concentric." },

  // WEEK 3
  // Day 1 - Biceps
  { week: 3, day: 1, movement: "ex_barbell_bicep_curl", sets: 6, reps: 8, order: 1, notes: "Increase weight from Week 2. Strict form." },
  { week: 3, day: 1, movement: "ex_incline_db_curl", sets: 4, reps: 10, order: 2, notes: "Stretch at bottom." },
  { week: 3, day: 1, movement: "ex_concentration_curl", sets: 3, reps: 12, order: 3, notes: "Each arm. Peak contraction." },
  { week: 3, day: 1, movement: "ex_cable_curl_21s", sets: 3, reps: 21, order: 4, notes: "7 bottom half, 7 top half, 7 full ROM." },
  
  // Day 2 - Chest
  { week: 3, day: 2, movement: "ex_barbell_bench_press", sets: 5, reps: 5, order: 1, notes: "85% of 3RM. Pause at chest.", is_3rm_percentage: true, percentage_3rm: 85 },
  { week: 3, day: 2, movement: "ex_decline_bench_press", sets: 4, reps: 8, order: 2, notes: "70% of flat bench 3RM.", is_3rm_percentage: true, percentage_3rm: 70 },
  { week: 3, day: 2, movement: "ex_seated_machine_press", sets: 4, reps: 12, order: 3, notes: "Focus on squeeze." },
  { week: 3, day: 2, movement: "ex_pec_deck", sets: 3, reps: 15, order: 4, notes: "Slow and controlled." },
  
  // Day 3 - Legs
  { week: 3, day: 3, movement: "ex_back_squat", sets: 6, reps: 4, order: 1, notes: "90% of 3RM.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 3, day: 3, movement: "ex_walking_lunge", sets: 4, reps: 12, order: 2, notes: "Each leg. Barbell or DBs." },
  { week: 3, day: 3, movement: "ex_leg_curl", sets: 4, reps: 12, order: 3, notes: "Control the negative." },
  { week: 3, day: 3, movement: "ex_calf_raise", sets: 4, reps: 20, order: 4, notes: "Full ROM. Pause at top." },
  
  // Day 4 - Triceps
  { week: 3, day: 4, movement: "ex_skull_crushers", sets: 5, reps: 10, order: 1, notes: "EZ bar. Control the weight." },
  { week: 3, day: 4, movement: "ex_tricep_pressdown", sets: 4, reps: 12, order: 2, notes: "Rope attachment." },
  { week: 3, day: 4, movement: "ex_kickbacks", sets: 3, reps: 15, order: 3, notes: "Each arm. Squeeze at top." },
  { week: 3, day: 4, movement: "ex_dips", sets: 3, reps: 0, order: 4, notes: "Max reps. Add weight if over 15 reps." },
  
  // Day 5 - Back
  { week: 3, day: 5, movement: "ex_rack_pulls", sets: 5, reps: 5, order: 1, notes: "Above knee. 100% of Deadlift 3RM or more.", is_3rm_percentage: true, percentage_3rm: 100 },
  { week: 3, day: 5, movement: "ex_pull_ups", sets: 5, reps: 0, order: 2, notes: "Max reps each set. Vary grip." },
  { week: 3, day: 5, movement: "ex_meadows_row", sets: 4, reps: 10, order: 3, notes: "Landmine setup. Each side." },
  { week: 3, day: 5, movement: "ex_cable_row", sets: 4, reps: 12, order: 4, notes: "Wide grip attachment." },
  
  // Day 6 - Shoulders
  { week: 3, day: 6, movement: "ex_military_press", sets: 5, reps: 5, order: 1, notes: "Standing. Strict form." },
  { week: 3, day: 6, movement: "ex_arnold_press", sets: 4, reps: 10, order: 2, notes: "Full rotation." },
  { week: 3, day: 6, movement: "ex_lateral_raise", sets: 4, reps: 15, order: 3, notes: "Light weight. Control." },
  { week: 3, day: 6, movement: "ex_rear_delt_fly", sets: 3, reps: 15, order: 4, notes: "Machine or DBs." },

  // WEEK 4
  // Day 1 - Biceps
  { week: 4, day: 1, movement: "ex_barbell_bicep_curl", sets: 4, reps: 12, order: 1, notes: "Deload week. Reduce weight 10-15%." },
  { week: 4, day: 1, movement: "ex_hammer_curl", sets: 3, reps: 12, order: 2, notes: "Lighter weight." },
  { week: 4, day: 1, movement: "ex_cable_curl", sets: 3, reps: 15, order: 3, notes: "Focus on form." },
  
  // Day 2 - Chest
  { week: 4, day: 2, movement: "ex_barbell_bench_press", sets: 4, reps: 8, order: 1, notes: "Deload: 75% of 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 4, day: 2, movement: "ex_db_flyes", sets: 3, reps: 12, order: 2, notes: "Focus on stretch." },
  { week: 4, day: 2, movement: "ex_push_ups", sets: 3, reps: 20, order: 3, notes: "Controlled tempo." },
  
  // Day 3 - Legs
  { week: 4, day: 3, movement: "ex_back_squat", sets: 4, reps: 8, order: 1, notes: "Deload: 75% of 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 4, day: 3, movement: "ex_goblet_squat", sets: 3, reps: 12, order: 2, notes: "Focus on depth and form." },
  { week: 4, day: 3, movement: "ex_rdl", sets: 3, reps: 10, order: 3, notes: "Lighter weight.", is_3rm_percentage: true, percentage_3rm: 60 },
  
  // Day 4 - Triceps
  { week: 4, day: 4, movement: "ex_tricep_pressdown", sets: 4, reps: 15, order: 1, notes: "Deload. Focus on pump." },
  { week: 4, day: 4, movement: "ex_overhead_extension", sets: 3, reps: 15, order: 2, notes: "Light weight." },
  { week: 4, day: 4, movement: "ex_diamond_push_ups", sets: 3, reps: 15, order: 3, notes: "Bodyweight only." },
  
  // Day 5 - Back
  { week: 4, day: 5, movement: "ex_deadlift", sets: 4, reps: 6, order: 1, notes: "Deload: 75% of 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 4, day: 5, movement: "ex_pull_ups", sets: 3, reps: 10, order: 2, notes: "Bodyweight only." },
  { week: 4, day: 5, movement: "ex_cable_row", sets: 3, reps: 12, order: 3, notes: "Light weight." },
  
  // Day 6 - Active Recovery
  { week: 4, day: 6, movement: "ex_db_clean_and_press", sets: 3, reps: 10, order: 1, notes: "Light weight. Focus on movement quality." },
  { week: 4, day: 6, movement: "ex_lateral_raise", sets: 3, reps: 15, order: 2, notes: "Very light." },
  { week: 4, day: 6, movement: "ex_face_pulls", sets: 3, reps: 20, order: 3, notes: "Focus on rear delts." },

  // WEEK 5
  // Day 1 - Biceps (Intensity increases)
  { week: 5, day: 1, movement: "ex_barbell_bicep_curl", sets: 6, reps: 6, order: 1, notes: "Heavy weight. Strict form." },
  { week: 5, day: 1, movement: "ex_preacher_curl", sets: 4, reps: 10, order: 2, notes: "EZ bar." },
  { week: 5, day: 1, movement: "ex_incline_hammer_curl", sets: 4, reps: 10, order: 3, notes: "Each arm." },
  { week: 5, day: 1, movement: "ex_cable_curl", sets: 3, reps: 15, order: 4, notes: "Burnout." },
  
  // Day 2 - Chest
  { week: 5, day: 2, movement: "ex_barbell_bench_press", sets: 6, reps: 3, order: 1, notes: "95% of 3RM. Heavy day.", is_3rm_percentage: true, percentage_3rm: 95 },
  { week: 5, day: 2, movement: "ex_incline_bench_press", sets: 4, reps: 8, order: 2, notes: "Barbell. 75% of flat 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 5, day: 2, movement: "ex_dips", sets: 4, reps: 10, order: 3, notes: "Weighted if possible." },
  { week: 5, day: 2, movement: "ex_cable_crossover", sets: 3, reps: 15, order: 4, notes: "Pump and squeeze." },
  
  // Day 3 - Legs
  { week: 5, day: 3, movement: "ex_back_squat", sets: 6, reps: 3, order: 1, notes: "95% of 3RM.", is_3rm_percentage: true, percentage_3rm: 95 },
  { week: 5, day: 3, movement: "ex_front_squat", sets: 4, reps: 6, order: 2, notes: "80% of back squat 3RM.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 5, day: 3, movement: "ex_rdl", sets: 4, reps: 8, order: 3, notes: "75% of Deadlift 3RM.", is_3rm_percentage: true, percentage_3rm: 75 },
  { week: 5, day: 3, movement: "ex_leg_press", sets: 3, reps: 12, order: 4, notes: "Heavy. Full ROM." },
  
  // Day 4 - Triceps
  { week: 5, day: 4, movement: "ex_close_grip_bench_press", sets: 5, reps: 5, order: 1, notes: "80% of Bench 3RM.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 5, day: 4, movement: "ex_skull_crushers", sets: 4, reps: 10, order: 2, notes: "Moderate weight." },
  { week: 5, day: 4, movement: "ex_tricep_pushdown", sets: 4, reps: 12, order: 3, notes: "Straight bar." },
  { week: 5, day: 4, movement: "ex_overhead_cable_extension", sets: 3, reps: 15, order: 4, notes: "Rope." },
  
  // Day 5 - Back
  { week: 5, day: 5, movement: "ex_deadlift", sets: 6, reps: 3, order: 1, notes: "95% of 3RM.", is_3rm_percentage: true, percentage_3rm: 95 },
  { week: 5, day: 5, movement: "ex_weighted_pull_ups", sets: 5, reps: 5, order: 2, notes: "Add significant weight." },
  { week: 5, day: 5, movement: "ex_bent_over_row", sets: 4, reps: 8, order: 3, notes: "Heavy. Controlled." },
  { week: 5, day: 5, movement: "ex_lat_pulldown", sets: 4, reps: 12, order: 4, notes: "Wide grip." },
  
  // Day 6 - Shoulders
  { week: 5, day: 6, movement: "ex_push_press", sets: 5, reps: 5, order: 1, notes: "Heavy. Use leg drive." },
  { week: 5, day: 6, movement: "ex_db_shoulder_press", sets: 4, reps: 8, order: 2, notes: "Seated." },
  { week: 5, day: 6, movement: "ex_upright_row", sets: 4, reps: 10, order: 3, notes: "Wide grip." },
  { week: 5, day: 6, movement: "ex_rear_delt_fly", sets: 3, reps: 15, order: 4, notes: "Bent over or machine." },

  // WEEK 6
  // Day 1 - Biceps
  { week: 6, day: 1, movement: "ex_barbell_bicep_curl", sets: 5, reps: 8, order: 1, notes: "Circuit format returns. 40s on, 20s off." },
  { week: 6, day: 1, movement: "ex_cable_hammer_curl", sets: 5, reps: 8, order: 2, notes: "Circuit format." },
  { week: 6, day: 1, movement: "ex_concentration_curl", sets: 5, reps: 8, order: 3, notes: "Circuit format." },
  { week: 6, day: 1, movement: "ex_preacher_curl", sets: 5, reps: 8, order: 4, notes: "Circuit format." },
  
  // Day 2 - Chest
  { week: 6, day: 2, movement: "ex_barbell_bench_press", sets: 5, reps: 5, order: 1, notes: "90% of 3RM. Last heavy bench week.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 6, day: 2, movement: "ex_decline_db_press", sets: 4, reps: 10, order: 2, notes: "Focus on lower chest." },
  { week: 6, day: 2, movement: "ex_incline_flyes", sets: 3, reps: 12, order: 3, notes: "Stretch at bottom." },
  { week: 6, day: 2, movement: "ex_push_ups", sets: 3, reps: 0, order: 4, notes: "Max reps to failure." },
  
  // Day 3 - Legs
  { week: 6, day: 3, movement: "ex_back_squat", sets: 5, reps: 5, order: 1, notes: "90% of 3RM.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 6, day: 3, movement: "ex_sumo_deadlift", sets: 4, reps: 6, order: 2, notes: "80% of conventional DL 3RM.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 6, day: 3, movement: "ex_bulgarian_split_squat", sets: 4, reps: 10, order: 3, notes: "Each leg. DBs or barbell." },
  { week: 6, day: 3, movement: "ex_glute_ham_raise", sets: 3, reps: 12, order: 4, notes: "Bodyweight or weighted." },
  
  // Day 4 - Triceps
  { week: 6, day: 4, movement: "ex_close_grip_bench_press", sets: 5, reps: 6, order: 1, notes: "75-80% of 3RM.", is_3rm_percentage: true, percentage_3rm: 78 },
  { week: 6, day: 4, movement: "ex_dips", sets: 4, reps: 10, order: 2, notes: "Weighted." },
  { week: 6, day: 4, movement: "ex_cable_pushdown", sets: 4, reps: 12, order: 3, notes: "V-bar." },
  { week: 6, day: 4, movement: "ex_overhead_db_extension", sets: 3, reps: 15, order: 4, notes: "Single DB, both hands." },
  
  // Day 5 - Back
  { week: 6, day: 5, movement: "ex_deadlift", sets: 5, reps: 5, order: 1, notes: "90% of 3RM.", is_3rm_percentage: true, percentage_3rm: 90 },
  { week: 6, day: 5, movement: "ex_pull_ups", sets: 5, reps: 0, order: 2, notes: "Max reps. Weighted if possible." },
  { week: 6, day: 5, movement: "ex_pendlay_row", sets: 4, reps: 8, order: 3, notes: "Explosive from floor." },
  { week: 6, day: 5, movement: "ex_cable_row", sets: 4, reps: 12, order: 4, notes: "Close grip." },
  
  // Day 6 - Full Body Power
  { week: 6, day: 6, movement: "ex_power_clean_push_press", sets: 5, reps: 3, order: 1, notes: "Explosive. Complex movement." },
  { week: 6, day: 6, movement: "ex_hang_snatch", sets: 4, reps: 3, order: 2, notes: "Focus on technique." },
  { week: 6, day: 6, movement: "ex_box_jumps", sets: 4, reps: 5, order: 3, notes: "Maximum height. Step down." },
  { week: 6, day: 6, movement: "ex_med_ball_slams", sets: 3, reps: 10, order: 4, notes: "Explosive. Full extension." },

  // WEEK 7
  // Day 1 - Biceps (Endurance focus)
  { week: 7, day: 1, movement: "ex_barbell_bicep_curl", sets: 4, reps: 15, order: 1, notes: "Lighter weight. High reps. Minimal rest." },
  { week: 7, day: 1, movement: "ex_cable_curl", sets: 4, reps: 15, order: 2, notes: "Continuous tension." },
  { week: 7, day: 1, movement: "ex_hammer_curl", sets: 4, reps: 15, order: 3, notes: "Alternating." },
  { week: 7, day: 1, movement: "ex_reverse_curl", sets: 3, reps: 20, order: 4, notes: "Focus on forearms." },
  
  // Day 2 - Chest (Volume)
  { week: 7, day: 2, movement: "ex_barbell_bench_press", sets: 4, reps: 10, order: 1, notes: "80% of 3RM. Volume focus.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 7, day: 2, movement: "ex_incline_db_press", sets: 4, reps: 12, order: 2, notes: "Focus on upper chest." },
  { week: 7, day: 2, movement: "ex_push_ups", sets: 4, reps: 25, order: 3, notes: "Various hand positions." },
  { week: 7, day: 2, movement: "ex_pec_deck", sets: 3, reps: 15, order: 4, notes: "Pump and squeeze." },
  
  // Day 3 - Legs (Volume)
  { week: 7, day: 3, movement: "ex_back_squat", sets: 4, reps: 10, order: 1, notes: "80% of 3RM.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 7, day: 3, movement: "ex_walking_lunge", sets: 4, reps: 15, order: 2, notes: "Each leg." },
  { week: 7, day: 3, movement: "ex_leg_curl", sets: 4, reps: 15, order: 3, notes: "Continuous tension." },
  { week: 7, day: 3, movement: "ex_leg_extension", sets: 4, reps: 15, order: 4, notes: "Slow negatives." },
  { week: 7, day: 3, movement: "ex_calf_raise", sets: 4, reps: 25, order: 5, notes: "High reps." },
  
  // Day 4 - Triceps (Endurance)
  { week: 7, day: 4, movement: "ex_close_grip_push_ups", sets: 4, reps: 20, order: 1, notes: "Bodyweight." },
  { week: 7, day: 4, movement: "ex_tricep_pushdown", sets: 4, reps: 15, order: 2, notes: "Light weight. Pump." },
  { week: 7, day: 4, movement: "ex_overhead_extension", sets: 4, reps: 15, order: 3, notes: "Cable or DB." },
  { week: 7, day: 4, movement: "ex_bench_dips", sets: 3, reps: 0, order: 4, notes: "Max reps." },
  
  // Day 5 - Back (Volume)
  { week: 7, day: 5, movement: "ex_deadlift", sets: 4, reps: 8, order: 1, notes: "80% of 3RM.", is_3rm_percentage: true, percentage_3rm: 80 },
  { week: 7, day: 5, movement: "ex_pull_ups", sets: 5, reps: 10, order: 2, notes: "Bodyweight. Quality reps." },
  { week: 7, day: 5, movement: "ex_cable_row", sets: 4, reps: 15, order: 3, notes: "Various grips." },
  { week: 7, day: 5, movement: "ex_lat_pulldown", sets: 4, reps: 15, order: 4, notes: "Wide and close grip." },
  
  // Day 6 - Shoulders (Endurance)
  { week: 7, day: 6, movement: "ex_db_shoulder_press", sets: 4, reps: 12, order: 1, notes: "Standing." },
  { week: 7, day: 6, movement: "ex_lateral_raise", sets: 4, reps: 20, order: 2, notes: "Light weight. Continuous." },
  { week: 7, day: 6, movement: "ex_front_raise", sets: 3, reps: 15, order: 3, notes: "Alternating." },
  { week: 7, day: 6, movement: "ex_rear_delt_fly", sets: 3, reps: 20, order: 4, notes: "Machine or DBs." },

  // WEEK 8 - Taper/Peak
  // Day 1 - Biceps (Light)
  { week: 8, day: 1, movement: "ex_barbell_bicep_curl", sets: 3, reps: 10, order: 1, notes: "Taper week. 60% effort." },
  { week: 8, day: 1, movement: "ex_hammer_curl", sets: 3, reps: 10, order: 2, notes: "Light." },
  { week: 8, day: 1, movement: "ex_cable_curl", sets: 2, reps: 15, order: 3, notes: "Pump only." },
  
  // Day 2 - Chest (Peak test)
  { week: 8, day: 2, movement: "ex_barbell_bench_press", sets: 3, reps: 3, order: 1, notes: "Work up to 100% of 3RM. Test new max.", is_3rm_percentage: true, percentage_3rm: 100 },
  { week: 8, day: 2, movement: "ex_push_ups", sets: 3, reps: 20, order: 2, notes: "Light work." },
  
  // Day 3 - Legs (Peak test)
  { week: 8, day: 3, movement: "ex_back_squat", sets: 3, reps: 3, order: 1, notes: "Work up to 100% of 3RM. Test new max.", is_3rm_percentage: true, percentage_3rm: 100 },
  { week: 8, day: 3, movement: "ex_goblet_squat", sets: 2, reps: 10, order: 2, notes: "Light mobility work." },
  
  // Day 4 - Triceps (Light)
  { week: 8, day: 4, movement: "ex_tricep_pushdown", sets: 3, reps: 12, order: 1, notes: "Light. Pump only." },
  { week: 8, day: 4, movement: "ex_dips", sets: 2, reps: 10, order: 2, notes: "Bodyweight." },
  
  // Day 5 - Back (Peak test)
  { week: 8, day: 5, movement: "ex_deadlift", sets: 3, reps: 3, order: 1, notes: "Work up to 100% of 3RM. Test new max.", is_3rm_percentage: true, percentage_3rm: 100 },
  { week: 8, day: 5, movement: "ex_pull_ups", sets: 3, reps: 0, order: 2, notes: "Max reps. Test yourself." },
  
  // Day 6 - Active Recovery
  { week: 8, day: 6, movement: "ex_db_clean_and_press", sets: 3, reps: 8, order: 1, notes: "Light. Focus on movement quality." },
  { week: 8, day: 6, movement: "ex_face_pulls", sets: 3, reps: 15, order: 2, notes: "Very light. Mobility." },
  { week: 8, day: 6, movement: "ex_lateral_raise", sets: 2, reps: 15, order: 3, notes: "Light pump." },
];

// Movements to add to library if missing
const MOVEMENTS_TO_ADD = [
  { name: "ex_barbell_bicep_curl", category: "accessory", description: "Barbell bicep curl" },
  { name: "ex_cable_hammer_curl", category: "accessory", description: "Cable hammer curl" },
  { name: "ex_ez_bar_preacher_curl", category: "accessory", description: "EZ bar preacher curl" },
  { name: "ex_seated_machine_curl", category: "accessory", description: "Seated machine curl" },
  { name: "ex_reverse_grip_ez_curl", category: "accessory", description: "Reverse grip EZ curl" },
  { name: "ex_seated_machine_press", category: "accessory", description: "Seated machine press" },
  { name: "ex_chest_dips", category: "accessory", description: "Chest dips - lean forward" },
  { name: "ex_belt_squat", category: "max_effort", description: "Belt squat" },
  { name: "ex_rdl", category: "max_effort", description: "Romanian deadlift" },
  { name: "ex_rear_elevated_split_squat", category: "accessory", description: "Rear elevated split squat (Bulgarian)" },
  { name: "ex_tricep_pressdown", category: "accessory", description: "Tricep cable pressdown" },
  { name: "ex_skull_crushers", category: "accessory", description: "Skull crushers (lying tricep extension)" },
  { name: "ex_cable_overhead_extension", category: "accessory", description: "Cable overhead tricep extension" },
  { name: "ex_close_grip_bench_press", category: "max_effort", description: "Close grip bench press" },
  { name: "ex_dips", category: "accessory", description: "Parallel bar dips" },
  { name: "ex_diamond_push_ups", category: "accessory", description: "Diamond push ups" },
  { name: "ex_deadlift", category: "max_effort", description: "Conventional deadlift" },
  { name: "ex_bent_over_row", category: "max_effort", description: "Barbell bent over row" },
  { name: "ex_pull_ups", category: "accessory", description: "Pull ups" },
  { name: "ex_seated_cable_row", category: "accessory", description: "Seated cable row" },
  { name: "ex_lat_pulldown", category: "accessory", description: "Lat pulldown" },
  { name: "ex_face_pulls", category: "accessory", description: "Face pulls" },
  { name: "ex_push_press", category: "max_effort", description: "Push press" },
  { name: "ex_muscle_snatch", category: "max_effort", description: "Muscle snatch" },
  { name: "ex_db_clean_and_press", category: "max_effort", description: "Dumbbell clean and press" },
  { name: "ex_db_lateral_raise", category: "accessory", description: "Dumbbell lateral raise" },
  { name: "ex_incline_db_press", category: "accessory", description: "Incline dumbbell press" },
  { name: "ex_cable_flyes", category: "accessory", description: "Cable chest flyes" },
  { name: "ex_push_ups", category: "accessory", description: "Push ups" },
  { name: "ex_back_squat", category: "max_effort", description: "Barbell back squat" },
  { name: "ex_hatfield_squat", category: "max_effort", description: "Hatfield squat (safety squat bar)" },
  { name: "ex_glute_ham_raise", category: "accessory", description: "Glute ham raise" },
  { name: "ex_leg_press", category: "accessory", description: "Leg press" },
  { name: "ex_overhead_tricep_extension", category: "accessory", description: "Overhead tricep extension" },
  { name: "ex_bench_dips", category: "accessory", description: "Bench dips" },
  { name: "ex_weighted_pull_ups", category: "accessory", description: "Weighted pull ups" },
  { name: "ex_t_bar_row", category: "accessory", description: "T-bar row" },
  { name: "ex_single_arm_db_row", category: "accessory", description: "Single arm dumbbell row" },
  { name: "ex_straight_arm_pulldown", category: "accessory", description: "Straight arm pulldown" },
  { name: "ex_power_clean", category: "max_effort", description: "Power clean" },
  { name: "ex_front_squat", category: "max_effort", description: "Front squat" },
  { name: "ex_barbell_row", category: "max_effort", description: "Barbell row" },
  { name: "ex_incline_db_curl", category: "accessory", description: "Incline dumbbell curl" },
  { name: "ex_concentration_curl", category: "accessory", description: "Concentration curl" },
  { name: "ex_cable_curl_21s", category: "accessory", description: "Cable curl 21s" },
  { name: "ex_decline_bench_press", category: "max_effort", description: "Decline bench press" },
  { name: "ex_pec_deck", category: "accessory", description: "Pec deck machine" },
  { name: "ex_walking_lunge", category: "accessory", description: "Walking lunge" },
  { name: "ex_leg_curl", category: "accessory", description: "Leg curl" },
  { name: "ex_calf_raise", category: "accessory", description: "Calf raise" },
  { name: "ex_kickbacks", category: "accessory", description: "Tricep kickbacks" },
  { name: "ex_rack_pulls", category: "max_effort", description: "Rack pulls" },
  { name: "ex_meadows_row", category: "accessory", description: "Meadows row (landmine)" },
  { name: "ex_cable_row", category: "accessory", description: "Cable row" },
  { name: "ex_military_press", category: "max_effort", description: "Standing military press" },
  { name: "ex_arnold_press", category: "accessory", description: "Arnold press" },
  { name: "ex_lateral_raise", category: "accessory", description: "Lateral raise" },
  { name: "ex_rear_delt_fly", category: "accessory", description: "Rear delt fly" },
  { name: "ex_hammer_curl", category: "accessory", description: "Hammer curl" },
  { name: "ex_cable_curl", category: "accessory", description: "Cable curl" },
  { name: "ex_db_flyes", category: "accessory", description: "Dumbbell flyes" },
  { name: "ex_goblet_squat", category: "accessory", description: "Goblet squat" },
  { name: "ex_overhead_extension", category: "accessory", description: "Overhead extension" },
  { name: "ex_preacher_curl", category: "accessory", description: "Preacher curl" },
  { name: "ex_incline_hammer_curl", category: "accessory", description: "Incline hammer curl" },
  { name: "ex_incline_bench_press", category: "max_effort", description: "Incline bench press" },
  { name: "ex_cable_crossover", category: "accessory", description: "Cable crossover" },
  { name: "ex_tricep_pushdown", category: "accessory", description: "Tricep pushdown" },
  { name: "ex_overhead_cable_extension", category: "accessory", description: "Overhead cable extension" },
  { name: "ex_db_shoulder_press", category: "accessory", description: "Dumbbell shoulder press" },
  { name: "ex_upright_row", category: "accessory", description: "Upright row" },
  { name: "ex_decline_db_press", category: "accessory", description: "Decline dumbbell press" },
  { name: "ex_incline_flyes", category: "accessory", description: "Incline flyes" },
  { name: "ex_sumo_deadlift", category: "max_effort", description: "Sumo deadlift" },
  { name: "ex_bulgarian_split_squat", category: "accessory", description: "Bulgarian split squat" },
  { name: "ex_cable_pushdown", category: "accessory", description: "Cable pushdown" },
  { name: "ex_overhead_db_extension", category: "accessory", description: "Overhead dumbbell extension" },
  { name: "ex_pendlay_row", category: "max_effort", description: "Pendlay row" },
  { name: "ex_power_clean_push_press", category: "max_effort", description: "Power clean to push press" },
  { name: "ex_hang_snatch", category: "max_effort", description: "Hang snatch" },
  { name: "ex_box_jumps", category: "accessory", description: "Box jumps" },
  { name: "ex_med_ball_slams", category: "accessory", description: "Medicine ball slams" },
  { name: "ex_reverse_curl", category: "accessory", description: "Reverse curl" },
  { name: "ex_leg_extension", category: "accessory", description: "Leg extension" },
  { name: "ex_close_grip_push_ups", category: "accessory", description: "Close grip push ups" },
  { name: "ex_front_raise", category: "accessory", description: "Front raise" },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting SFAS program import...');

    // Step 1: Add missing movements to library
    console.log('Adding movements to library...');
    const { data: existingMovements } = await supabase
      .from('movement_library')
      .select('name');
    
    const existingNames = new Set(existingMovements?.map(m => m.name) || []);
    const newMovements = MOVEMENTS_TO_ADD.filter(m => !existingNames.has(m.name));
    
    if (newMovements.length > 0) {
      const { error: movementError } = await supabase
        .from('movement_library')
        .insert(newMovements);
      
      if (movementError) {
        console.error('Error adding movements:', movementError);
      } else {
        console.log(`Added ${newMovements.length} new movements`);
      }
    }

    // Step 2: Create the program
    console.log('Creating SFAS program...');
    const { data: program, error: programError } = await supabase
      .from('workout_programs')
      .insert(SFAS_PROGRAM)
      .select()
      .single();

    if (programError) {
      throw new Error(`Failed to create program: ${programError.message}`);
    }

    console.log(`Created program with ID: ${program.id}`);

    // Step 3: Insert all exercises
    console.log('Inserting exercises...');
    const exercisesToInsert = EXERCISES.map(ex => ({
      program_id: program.id,
      week_number: ex.week,
      day_of_week: ex.day,
      movement_name: ex.movement,
      sets: ex.sets,
      reps: ex.reps,
      order_position: ex.order,
      notes: ex.notes,
      is_bodyweight_percentage: ex.is_bw_percentage || false,
      bodyweight_percentage: ex.bw_percentage || null,
    }));

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) {
      throw new Error(`Failed to insert exercises: ${exercisesError.message}`);
    }

    console.log(`Inserted ${exercisesToInsert.length} exercises`);

    return new Response(
      JSON.stringify({
        success: true,
        program_id: program.id,
        program_title: program.title,
        exercises_count: exercisesToInsert.length,
        movements_added: newMovements.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
