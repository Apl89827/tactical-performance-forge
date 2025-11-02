import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkoutRequest {
  userId: string;
  date: string;
  templateId?: string;
  dayType: "max_effort_upper" | "max_effort_lower" | "dynamic_effort_upper" | "dynamic_effort_lower";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, date, templateId, dayType } = await req.json() as WorkoutRequest;

    // Fetch user profile for 5RM data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Fetch template or use default
    let template;
    if (templateId) {
      const { data } = await supabase
        .from("conjugate_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      template = data;
    } else {
      const { data } = await supabase
        .from("conjugate_templates")
        .select("*")
        .eq("template_type", dayType)
        .eq("is_active", true)
        .limit(1)
        .single();
      template = data;
    }

    if (!template) {
      return new Response(
        JSON.stringify({ error: "No template found for this workout type" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = template.config;
    const exercises = [];

    // Generate workout based on day type
    switch (dayType) {
      case "max_effort_upper":
        // Main ME movement (rotation from pool)
        const meUpperPool = config.variationPools?.meUpper || [];
        if (meUpperPool.length > 0) {
          const movement = meUpperPool[Math.floor(Math.random() * meUpperPool.length)];
          exercises.push({
            movement_name: movement,
            sets: 5,
            reps: 5,
            order_position: 0,
            notes: "Work up to 5RM. Track weight progression.",
            is_bodyweight_percentage: false
          });
        }
        
        // Accessory work
        const upperPushPool = config.accessoryCategories?.upperPush || [];
        const upperPullPool = config.accessoryCategories?.upperPull || [];
        
        if (upperPushPool.length > 0) {
          exercises.push({
            movement_name: upperPushPool[Math.floor(Math.random() * upperPushPool.length)],
            sets: 3,
            reps: 10,
            order_position: 1,
            notes: "Accessory push work",
            is_bodyweight_percentage: false
          });
        }
        
        if (upperPullPool.length > 0) {
          exercises.push({
            movement_name: upperPullPool[Math.floor(Math.random() * upperPullPool.length)],
            sets: 3,
            reps: 10,
            order_position: 2,
            notes: "Accessory pull work",
            is_bodyweight_percentage: false
          });
        }
        break;

      case "max_effort_lower":
        // Main ME movement
        const meLowerPool = config.variationPools?.meLower || [];
        if (meLowerPool.length > 0) {
          const movement = meLowerPool[Math.floor(Math.random() * meLowerPool.length)];
          exercises.push({
            movement_name: movement,
            sets: 5,
            reps: 5,
            order_position: 0,
            notes: "Work up to 5RM. Track weight progression.",
            is_bodyweight_percentage: false
          });
        }
        
        // Posterior chain accessory
        const posteriorPool = config.accessoryCategories?.posteriorChain || [];
        if (posteriorPool.length > 0) {
          exercises.push({
            movement_name: posteriorPool[Math.floor(Math.random() * posteriorPool.length)],
            sets: 3,
            reps: 12,
            order_position: 1,
            notes: "Posterior chain accessory",
            is_bodyweight_percentage: false
          });
        }
        break;

      case "dynamic_effort_upper":
      case "dynamic_effort_lower":
        // DE work with wave loading
        const deWave = config.deWaves?.[0] || { percent: 60, sets: 8, reps: 3 };
        const deMovement = dayType === "dynamic_effort_upper" 
          ? "Speed Bench Press" 
          : "Speed Squat";
        
        exercises.push({
          movement_name: deMovement,
          sets: deWave.sets,
          reps: deWave.reps,
          order_position: 0,
          notes: `${deWave.percent}% of 1RM. Focus on bar speed.`,
          is_bodyweight_percentage: false
        });
        
        // GPP work
        const gppPool = config.accessoryCategories?.gpp || [];
        if (gppPool.length > 0) {
          exercises.push({
            movement_name: gppPool[Math.floor(Math.random() * gppPool.length)],
            sets: 3,
            reps: 15,
            order_position: 1,
            notes: "General physical preparedness",
            is_bodyweight_percentage: false
          });
        }
        break;
    }

    // Create scheduled workout
    const { data: workout, error } = await supabase
      .from("user_scheduled_workouts")
      .insert({
        user_id: userId,
        date: date,
        title: template.name,
        day_type: dayType,
        exercises: exercises,
        source: "generator",
        status: "scheduled"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workout:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ workout }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-workout:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});