import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  userId: string;
  programId: string;
  startDate: string; // YYYY-MM-DD format
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, programId, startDate }: ScheduleRequest = await req.json();

    console.log(`Generating schedule for user ${userId}, program ${programId}, starting ${startDate}`);

    // Fetch program details
    const { data: program, error: programError } = await supabase
      .from("workout_programs")
      .select("id, title, description, duration_weeks, days_per_week, program_type")
      .eq("id", programId)
      .single();

    if (programError || !program) {
      console.error("Program fetch error:", programError);
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch program exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("program_id", programId)
      .order("week_number", { ascending: true })
      .order("day_of_week", { ascending: true })
      .order("order_position", { ascending: true });

    if (exercisesError) {
      console.error("Exercises fetch error:", exercisesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch exercises" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${exercises?.length || 0} exercises for program`);

    // Delete any existing scheduled workouts for this program
    const { error: deleteError } = await supabase
      .from("user_scheduled_workouts")
      .delete()
      .eq("user_id", userId)
      .eq("program_id", programId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
    }

    // Create program assignment
    const { error: assignError } = await supabase
      .from("user_program_assignments")
      .upsert({
        user_id: userId,
        program_id: programId,
        start_date: startDate,
        end_date: addDays(new Date(startDate), program.duration_weeks * 7).toISOString().split("T")[0],
      }, {
        onConflict: "user_id,program_id",
      });

    if (assignError) {
      console.log("Assignment note (may be expected):", assignError.message);
    }

    // Generate scheduled workouts for each week
    const scheduledWorkouts: any[] = [];
    const start = new Date(startDate);
    const daysPerWeek = program.days_per_week || 4;
    
    // Map day_of_week to actual day offsets (1=Mon, 2=Tue, etc.)
    // For simplicity, spread workouts across the week
    const workoutDayOffsets = getDayOffsets(daysPerWeek);
    const allDayOffsets = [0, 1, 2, 3, 4, 5, 6]; // All 7 days of the week

    for (let week = 1; week <= program.duration_weeks; week++) {
      // Get exercises for this week (or default to week 1 if not specified)
      const weekExercises = exercises?.filter(e => e.week_number === week) || [];
      const fallbackExercises = weekExercises.length > 0 
        ? weekExercises 
        : exercises?.filter(e => e.week_number === 1) || [];

      // Create entries for all 7 days of the week
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const workoutDate = addDays(start, (week - 1) * 7 + dayOffset);
        const isWorkoutDay = workoutDayOffsets.includes(dayOffset);
        
        if (isWorkoutDay) {
          // This is a workout day
          const dayIndex = workoutDayOffsets.indexOf(dayOffset);
          const dayOfWeek = dayIndex + 1;
          
          // Get exercises for this day
          const dayExercises = fallbackExercises.filter(e => e.day_of_week === dayOfWeek);
          const exercisesForDay = dayExercises.length > 0 
            ? dayExercises 
            : fallbackExercises.slice(
                Math.floor(fallbackExercises.length / daysPerWeek) * dayIndex,
                Math.floor(fallbackExercises.length / daysPerWeek) * (dayIndex + 1) || fallbackExercises.length
              );

          // Build the workout title based on day type
          const dayTypes = ["Strength", "Work Capacity", "Endurance", "Recovery"];
          const dayType = dayTypes[dayIndex % dayTypes.length];
          
          scheduledWorkouts.push({
            user_id: userId,
            program_id: programId,
            date: workoutDate.toISOString().split("T")[0],
            title: `Week ${week} - Day ${dayIndex + 1}: ${dayType}`,
            day_type: dayType,
            week_number: week,
            status: "scheduled",
            source: "program_generator",
            exercises: exercisesForDay.map((e, idx) => ({
              movement_name: e.movement_name,
              sets: e.sets,
              reps: e.reps,
              notes: e.notes || "",
              order_position: idx + 1,
              is_bodyweight_percentage: e.is_bodyweight_percentage || false,
              bodyweight_percentage: e.bodyweight_percentage || null,
            })),
          });
        } else {
          // This is a rest day
          scheduledWorkouts.push({
            user_id: userId,
            program_id: programId,
            date: workoutDate.toISOString().split("T")[0],
            title: `Week ${week} - Rest Day`,
            day_type: "Rest",
            week_number: week,
            status: "rest",
            source: "program_generator",
            exercises: [],
          });
        }
      }
    }

    console.log(`Generated ${scheduledWorkouts.length} scheduled workouts`);

    // Insert all scheduled workouts
    const { data: insertedWorkouts, error: insertError } = await supabase
      .from("user_scheduled_workouts")
      .insert(scheduledWorkouts)
      .select("id, date, title");

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create schedule", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate notifications for each workout
    const notifications = scheduledWorkouts.map(workout => ({
      user_id: userId,
      notification_type: "workout_reminder",
      title: "Workout Today",
      message: `Time for ${workout.title}`,
      scheduled_for: new Date(`${workout.date}T06:00:00`).toISOString(),
      status: "pending",
      data: { workout_date: workout.date },
    }));

    const { error: notifyError } = await supabase
      .from("notification_queue")
      .insert(notifications);

    if (notifyError) {
      console.log("Notification insert note:", notifyError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        workoutsCreated: insertedWorkouts?.length || 0,
        program: program.title,
        startDate,
        endDate: addDays(start, program.duration_weeks * 7).toISOString().split("T")[0],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDayOffsets(daysPerWeek: number): number[] {
  // Spread workout days across the week
  // E.g., 4 days/week = Mon(0), Tue(1), Thu(3), Fri(4)
  switch (daysPerWeek) {
    case 2:
      return [0, 3]; // Mon, Thu
    case 3:
      return [0, 2, 4]; // Mon, Wed, Fri
    case 4:
      return [0, 1, 3, 4]; // Mon, Tue, Thu, Fri
    case 5:
      return [0, 1, 2, 3, 4]; // Mon-Fri
    case 6:
      return [0, 1, 2, 3, 4, 5]; // Mon-Sat
    default:
      return [0, 1, 3, 4]; // Default 4 days
  }
}
