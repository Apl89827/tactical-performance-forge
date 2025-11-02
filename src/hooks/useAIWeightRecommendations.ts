import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AIWeightRecommendation {
  recommendedWeight: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  historicalDataPoints: number;
}

export const useAIWeightRecommendations = (
  userId: string,
  exerciseName: string,
  targetReps: number,
  contextData?: {
    lastWeight?: number;
    lastReps?: number;
    rpe?: number;
  }
) => {
  const [recommendation, setRecommendation] = useState<AIWeightRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !exerciseName) return;

    const fetchAIRecommendation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: funcError } = await supabase.functions.invoke("ai-weight-predictor", {
          body: {
            userId,
            exerciseName,
            targetReps,
            contextData,
          },
        });

        if (funcError) {
          if (funcError.message?.includes("429")) {
            setError("Rate limit exceeded. Using fallback recommendations.");
          } else if (funcError.message?.includes("402")) {
            setError("AI credits depleted. Using fallback recommendations.");
          } else {
            setError("AI service error. Using fallback recommendations.");
          }
          console.error("AI weight predictor error:", funcError);
          
          // Fallback to basic recommendation
          const fallback = await getFallbackRecommendation(userId, exerciseName, targetReps);
          setRecommendation(fallback);
          return;
        }

        if (data?.prediction) {
          setRecommendation(data.prediction);
        }
      } catch (err) {
        console.error("Error fetching AI recommendation:", err);
        setError("Failed to get AI recommendation");
        
        // Fallback to basic recommendation
        const fallback = await getFallbackRecommendation(userId, exerciseName, targetReps);
        setRecommendation(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchAIRecommendation();
  }, [userId, exerciseName, targetReps, contextData?.lastWeight, contextData?.lastReps, contextData?.rpe]);

  return { recommendation, loading, error };
};

// Fallback recommendation logic when AI is unavailable
async function getFallbackRecommendation(
  userId: string,
  exerciseName: string,
  targetReps: number
): Promise<AIWeightRecommendation> {
  try {
    // Check profile for 5RM data
    const { data: profile } = await supabase
      .from("profiles")
      .select("bench_5rm, squat_5rm, deadlift_5rm, weight")
      .eq("id", userId)
      .single();

    let recommendedWeight = 0;
    let confidence: "high" | "medium" | "low" = "low";
    let reasoning = "Using basic calculation based on available data.";

    // Check if we have 5RM data for this exercise type
    if (profile) {
      const exerciseLower = exerciseName.toLowerCase();
      let fiveRM = 0;

      if (exerciseLower.includes("bench") || exerciseLower.includes("press")) {
        fiveRM = profile.bench_5rm || 0;
      } else if (exerciseLower.includes("squat")) {
        fiveRM = profile.squat_5rm || 0;
      } else if (exerciseLower.includes("deadlift")) {
        fiveRM = profile.deadlift_5rm || 0;
      }

      if (fiveRM > 0) {
        const estimatedOneRM = fiveRM * 1.167;
        const percentage = targetReps <= 3 ? 0.90 : targetReps <= 5 ? 0.85 : targetReps <= 8 ? 0.75 : 0.65;
        recommendedWeight = Math.round((estimatedOneRM * percentage) / 5) * 5;
        confidence = "medium";
        reasoning = `Based on your ${fiveRM}lb 5RM, estimated for ${targetReps} reps.`;
      }
    }

    // Ultimate fallback: bodyweight percentage for bodyweight exercises
    if (recommendedWeight === 0 && profile?.weight) {
      const exerciseLower = exerciseName.toLowerCase();
      if (exerciseLower.includes("pullup") || exerciseLower.includes("chinup") || exerciseLower.includes("dip")) {
        recommendedWeight = profile.weight;
        confidence = "low";
        reasoning = "Using bodyweight as baseline. Adjust as needed.";
      }
    }

    return {
      recommendedWeight: recommendedWeight || 0,
      confidence,
      reasoning,
      historicalDataPoints: 0,
    };
  } catch (error) {
    console.error("Error in fallback recommendation:", error);
    return {
      recommendedWeight: 0,
      confidence: "low",
      reasoning: "Unable to calculate recommendation. Please enter weight manually.",
      historicalDataPoints: 0,
    };
  }
}