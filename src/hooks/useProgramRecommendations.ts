import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Recommendation {
  programId: string;
  programTitle: string;
  programDescription: string | null;
  programType: string;
  durationWeeks: number;
  daysPerWeek: number;
  reason: string;
  priority: "high" | "medium";
  metric: string;
  currentValue: string | number;
  targetValue: string | number;
}

interface PTMetrics {
  pushups: number | null;
  run_time: string | null;
}

interface RecommendableProgram {
  id: string;
  title: string;
  description: string | null;
  program_type: string;
  duration_weeks: number;
  days_per_week: number;
  recommendation_type: string | null;
  recommendation_threshold_metric: string | null;
  recommendation_threshold_value: string | null;
  recommendation_condition: string | null;
}

// Parse "MM:SS" to decimal minutes for comparison
const parseRunTime = (timeStr: string): number => {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes + seconds / 60;
  }
  return parseFloat(timeStr) || 0;
};

export const useProgramRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [ptMetrics, setPtMetrics] = useState<PTMetrics | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch latest PT metrics
      const { data: ptData } = await supabase
        .from("pt_metrics")
        .select("pushups, run_time")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      setPtMetrics(ptData);

      if (!ptData) {
        setLoading(false);
        return;
      }

      // Fetch programs with recommendation metadata
      const { data: programs } = await supabase
        .from("workout_programs")
        .select(`
          id,
          title,
          description,
          program_type,
          duration_weeks,
          days_per_week,
          recommendation_type,
          recommendation_threshold_metric,
          recommendation_threshold_value,
          recommendation_condition
        `)
        .eq("is_public", true)
        .not("recommendation_type", "is", null);

      // Fetch user's active program assignments to exclude
      const { data: activeAssignments } = await supabase
        .from("user_program_assignments")
        .select("program_id")
        .eq("user_id", user.id);

      const activeProgramIds = new Set(activeAssignments?.map((p) => p.program_id) || []);

      // Evaluate recommendations
      const recs: Recommendation[] = [];

      for (const program of (programs as RecommendableProgram[]) || []) {
        // Skip if already active
        if (activeProgramIds.has(program.id)) continue;

        const { recommendation_threshold_metric, recommendation_threshold_value, recommendation_condition } = program;

        if (!recommendation_threshold_metric || !recommendation_threshold_value || !recommendation_condition) continue;

        let shouldRecommend = false;
        let currentValue: string | number = "";
        let targetValue: string | number = "";
        let reason = "";

        if (recommendation_threshold_metric === "pushups" && ptData.pushups !== null) {
          const threshold = parseInt(recommendation_threshold_value);
          currentValue = ptData.pushups;
          targetValue = threshold;

          if (recommendation_condition === "below" && ptData.pushups < threshold) {
            shouldRecommend = true;
            reason = `Your push-up count (${ptData.pushups}) is below ${threshold} reps`;
          } else if (recommendation_condition === "above" && ptData.pushups > threshold) {
            shouldRecommend = true;
            reason = `Your push-up count (${ptData.pushups}) is above ${threshold} reps`;
          }
        }

        if (recommendation_threshold_metric === "run_time" && ptData.run_time) {
          const thresholdMinutes = parseRunTime(recommendation_threshold_value);
          const currentMinutes = parseRunTime(ptData.run_time);
          currentValue = ptData.run_time;
          targetValue = recommendation_threshold_value;

          if (recommendation_condition === "above" && currentMinutes > thresholdMinutes) {
            shouldRecommend = true;
            reason = `Your 1.5mi run time (${ptData.run_time}) is above ${recommendation_threshold_value}`;
          } else if (recommendation_condition === "below" && currentMinutes < thresholdMinutes) {
            shouldRecommend = true;
            reason = `Your 1.5mi run time (${ptData.run_time}) is below ${recommendation_threshold_value}`;
          }
        }

        if (shouldRecommend) {
          recs.push({
            programId: program.id,
            programTitle: program.title,
            programDescription: program.description,
            programType: program.program_type,
            durationWeeks: program.duration_weeks,
            daysPerWeek: program.days_per_week,
            reason,
            priority: "high",
            metric: recommendation_threshold_metric,
            currentValue,
            targetValue,
          });
        }
      }

      setRecommendations(recs);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, ptMetrics, refetch: fetchRecommendations };
};
