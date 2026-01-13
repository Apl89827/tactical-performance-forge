-- Insert the 5-Mile Run Program
INSERT INTO workout_programs (title, description, duration_weeks, days_per_week, is_public, program_type)
VALUES (
  '5-Mile Run Program',
  'An 8-week running program designed by Jeff Nichols CSCS to improve your 5-mile run time. Features interval training, tempo runs, and heart rate-based endurance work with progressive distance increases.',
  8,
  5,
  true,
  'endurance'
);

-- Get the program ID for inserting exercises
DO $$
DECLARE
  program_uuid UUID;
BEGIN
  SELECT id INTO program_uuid FROM workout_programs WHERE title = '5-Mile Run Program' LIMIT 1;

  -- WEEK 1
  -- Day 1: Interval Sprints
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '5-10 min easy jog', 1, 1, 1),
    (program_uuid, '100m Sprint', 8, 1, 'Sprint 100m, walk back recovery', 1, 1, 2),
    (program_uuid, 'Cool-down Walk', 1, 1, '5 min walk', 1, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '2-3 miles at conversational pace (HR Zone 2)', 1, 2, 1);
  
  -- Day 3: Tempo Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 1, 3, 1),
    (program_uuid, 'Tempo Run', 1, 1, '15 min at threshold pace (HR Zone 4)', 1, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 1, 3, 3);
  
  -- Day 4: Recovery/Cross-train
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Swimming, cycling, or complete rest', 1, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '4 miles at easy pace (HR Zone 2-3)', 1, 5, 1);

  -- WEEK 2
  -- Day 1: Interval Sprints
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '5-10 min easy jog', 2, 1, 1),
    (program_uuid, '200m Sprint', 6, 1, 'Sprint 200m, 90 sec rest between', 2, 1, 2),
    (program_uuid, 'Cool-down Walk', 1, 1, '5 min walk', 2, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '3 miles at conversational pace', 2, 2, 1);
  
  -- Day 3: Tempo Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 2, 3, 1),
    (program_uuid, 'Tempo Run', 1, 1, '20 min at threshold pace', 2, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 2, 3, 3);
  
  -- Day 4: Recovery
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Active recovery or rest', 2, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '5 miles at easy pace', 2, 5, 1);

  -- WEEK 3
  -- Day 1: Fartlek
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 3, 1, 1),
    (program_uuid, 'Fartlek Run', 1, 1, '20 min varying pace: 2 min fast, 2 min easy', 3, 1, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 3, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '3-4 miles at easy pace', 3, 2, 1);
  
  -- Day 3: Hill Repeats
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 3, 3, 1),
    (program_uuid, 'Hill Repeats', 6, 1, '60-90 sec uphill at hard effort, jog down recovery', 3, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 3, 3, 3);
  
  -- Day 4: Recovery
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Low impact activity or rest', 3, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '5-6 miles at easy pace', 3, 5, 1);

  -- WEEK 4 (Recovery Week)
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '2-3 miles easy pace', 4, 1, 1),
    (program_uuid, 'Easy Run', 1, 1, '2-3 miles easy pace', 4, 2, 1),
    (program_uuid, 'Tempo Run', 1, 1, '15 min at moderate effort', 4, 3, 1),
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Active recovery', 4, 4, 1),
    (program_uuid, 'Long Run', 1, 1, '4 miles easy - recovery week', 4, 5, 1);

  -- WEEK 5
  -- Day 1: Track Intervals
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 5, 1, 1),
    (program_uuid, '400m Intervals', 6, 1, '400m at 5K pace, 90 sec rest between', 5, 1, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '10 min easy', 5, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '4 miles at easy pace', 5, 2, 1);
  
  -- Day 3: Tempo Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 5, 3, 1),
    (program_uuid, 'Tempo Run', 1, 1, '25 min at threshold pace', 5, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 5, 3, 3);
  
  -- Day 4: Recovery
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Pool running or cycling recommended', 5, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '6-7 miles at easy pace', 5, 5, 1);

  -- WEEK 6
  -- Day 1: Ladder Intervals
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 6, 1, 1),
    (program_uuid, 'Ladder Intervals', 1, 1, '200m-400m-800m-400m-200m at hard effort, equal rest', 6, 1, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '10 min easy', 6, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '4-5 miles at easy pace', 6, 2, 1);
  
  -- Day 3: Tempo + Hills
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 6, 3, 1),
    (program_uuid, 'Hill Tempo', 1, 1, '20 min tempo on rolling hills', 6, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 6, 3, 3);
  
  -- Day 4: Recovery
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Light activity or rest', 6, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '7 miles with last 2 at tempo pace', 6, 5, 1);

  -- WEEK 7
  -- Day 1: Race Pace Intervals
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 7, 1, 1),
    (program_uuid, '800m Intervals', 5, 1, '800m at goal 5-mile race pace, 2 min rest', 7, 1, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '10 min easy', 7, 1, 3);
  
  -- Day 2: Easy Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '4 miles at recovery pace', 7, 2, 1);
  
  -- Day 3: Tempo Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Warm-up Jog', 1, 1, '10 min easy', 7, 3, 1),
    (program_uuid, 'Tempo Run', 1, 1, '30 min at threshold pace', 7, 3, 2),
    (program_uuid, 'Cool-down Jog', 1, 1, '5 min easy', 7, 3, 3);
  
  -- Day 4: Recovery
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Cross-Training or Rest', 1, 1, 'Rest recommended', 7, 4, 1);
  
  -- Day 5: Long Run
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Long Run', 1, 1, '8 miles at easy pace - peak week', 7, 5, 1);

  -- WEEK 8 (Taper Week)
  INSERT INTO workout_exercises (program_id, movement_name, sets, reps, notes, week_number, day_of_week, order_position)
  VALUES 
    (program_uuid, 'Easy Run', 1, 1, '3 miles with 4x100m strides', 8, 1, 1),
    (program_uuid, 'Easy Run', 1, 1, '2-3 miles at easy pace', 8, 2, 1),
    (program_uuid, 'Shakeout Run', 1, 1, '2 miles easy with 2x200m at race pace', 8, 3, 1),
    (program_uuid, 'Rest', 1, 1, 'Complete rest day before race', 8, 4, 1),
    (program_uuid, '5-Mile Time Trial', 1, 1, 'RACE DAY! Run your best 5-mile time', 8, 5, 1);
END $$;