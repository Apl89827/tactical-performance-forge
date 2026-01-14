import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PredictionRequest {
  userId: string;
  exerciseName: string;
  targetReps: number;
  contextData?: {
    lastWeight?: number;
    lastReps?: number;
    rpe?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify authentication
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log(`Authenticated user: ${authenticatedUserId}`);

    // Parse request body
    const { userId, exerciseName, targetReps, contextData } = await req.json() as PredictionRequest;

    // Verify user is operating on their own data
    if (userId !== authenticatedUserId) {
      // Check if user is an admin or coach for this user
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: isAdmin } = await adminSupabase.rpc("has_role", { 
        _user_id: authenticatedUserId, 
        _role: "admin" 
      });
      
      const { data: coachAssignment } = await adminSupabase
        .from("coach_assignments")
        .select("id")
        .eq("coach_id", authenticatedUserId)
        .eq("athlete_id", userId)
        .single();

      if (!isAdmin && !coachAssignment) {
        console.error(`User ${authenticatedUserId} attempted to access data for user ${userId}`);
        return new Response(
          JSON.stringify({ error: "Forbidden: Cannot access another user's data" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Authorized access: admin=${!!isAdmin}, coach=${!!coachAssignment}`);
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile and historical data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get recent set logs for this exercise
    const { data: setLogs } = await supabase
      .from("user_set_logs")
      .select(`
        *,
        workout_log:user_workout_logs!inner(
          scheduled_workout:user_scheduled_workouts!inner(
            user_id
          )
        )
      `)
      .eq("workout_log.scheduled_workout.user_id", userId)
      .ilike("workout_log.scheduled_workout.exercises", `%${exerciseName}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    // Build context for AI
    const historicalData = setLogs?.map(log => ({
      weight: log.actual_weight || log.target_weight,
      reps: log.actual_reps || log.target_reps,
      completed: log.completed,
      date: log.created_at
    })) || [];

    const systemPrompt = `You are an expert strength coach specializing in weight progression recommendations. 
Based on the user's historical performance data and target rep range, suggest an appropriate working weight.

Consider:
- Progressive overload principles
- Recent performance trends
- Fatigue and recovery indicators
- Rep range differences (lower reps = higher weight percentage)

Return ONLY a JSON object with this structure:
{
  "recommendedWeight": <number>,
  "confidence": <"high" | "medium" | "low">,
  "reasoning": "<brief explanation>"
}`;

    const userPrompt = `Exercise: ${exerciseName}
Target Reps: ${targetReps}
User Weight: ${profile?.weight || "Unknown"} lbs

User 5RM Data:
- Bench: ${profile?.bench_5rm || "Unknown"} lbs
- Squat: ${profile?.squat_5rm || "Unknown"} lbs
- Deadlift: ${profile?.deadlift_5rm || "Unknown"} lbs

Recent Performance (last 20 sets):
${historicalData.map(d => `${d.weight}lbs x ${d.reps} reps ${d.completed ? '✓' : '✗'}`).join('\n')}

${contextData?.lastWeight ? `Last session: ${contextData.lastWeight}lbs x ${contextData.lastReps} reps (RPE: ${contextData.rpe || 'N/A'})` : ''}

What weight should they use for ${targetReps} reps today?`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    return new Response(
      JSON.stringify({ 
        prediction: {
          recommendedWeight: prediction.recommendedWeight,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
          historicalDataPoints: historicalData.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-weight-predictor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
