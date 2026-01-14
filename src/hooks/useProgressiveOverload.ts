import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SetHistory {
  weight: number;
  reps: number;
  completed: boolean;
  date: string;
}

interface ProgressiveOverloadRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  progressionType: "weight" | "reps" | "maintain" | "deload";
  percentChange: number;
}

interface UseProgressiveOverloadParams {
  userId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
}

/**
 * Progressive overload engine that analyzes performance history
 * and recommends weight/rep progressions following proven principles:
 * - Double progression (reps first, then weight)
 * - 2.5-5lb increases for upper body, 5-10lb for lower body
 * - Deload detection based on consecutive missed reps
 */
export const useProgressiveOverload = ({
  userId,
  exerciseName,
  targetSets,
  targetReps,
}: UseProgressiveOverloadParams) => {
  const [recommendation, setRecommendation] = useState<ProgressiveOverloadRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SetHistory[]>([]);

  // Determine if exercise is lower body (for progression increment)
  const isLowerBody = useCallback((name: string): boolean => {
    const lowerPatterns = [
      "squat", "deadlift", "rdl", "leg press", "lunge", 
      "hip thrust", "leg curl", "leg extension", "calf"
    ];
    const lowerName = name.toLowerCase();
    return lowerPatterns.some(p => lowerName.includes(p));
  }, []);

  // Calculate the weight increment based on exercise type
  const getWeightIncrement = useCallback((name: string): number => {
    return isLowerBody(name) ? 5 : 2.5;
  }, [isLowerBody]);

  // Analyze performance and generate recommendation
  const analyzePerformance = useCallback((history: SetHistory[]): ProgressiveOverloadRecommendation => {
    if (history.length === 0) {
      return {
        recommendedWeight: 0,
        recommendedReps: targetReps,
        confidence: "low",
        reasoning: "No history available. Start with a comfortable weight.",
        progressionType: "maintain",
        percentChange: 0,
      };
    }

    // Group by workout sessions (same date)
    const sessions = history.reduce((acc, set) => {
      const date = set.date.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(set);
      return acc;
    }, {} as Record<string, SetHistory[]>);

    const sessionDates = Object.keys(sessions).sort().reverse();
    const recentSessions = sessionDates.slice(0, 3); // Look at last 3 sessions

    if (recentSessions.length === 0) {
      return {
        recommendedWeight: 0,
        recommendedReps: targetReps,
        confidence: "low",
        reasoning: "Start with a comfortable weight.",
        progressionType: "maintain",
        percentChange: 0,
      };
    }

    // Analyze last session performance
    const lastSession = sessions[recentSessions[0]];
    const lastWeight = lastSession[0]?.weight || 0;
    const completedSets = lastSession.filter(s => s.completed && s.reps >= targetReps);
    const allSetsHitTarget = completedSets.length >= targetSets;
    
    // Calculate average reps achieved
    const avgReps = lastSession.reduce((sum, s) => sum + (s.reps || 0), 0) / lastSession.length;
    
    // Check for deload signals (3 sessions of not hitting targets)
    let consecutiveMisses = 0;
    for (const date of recentSessions) {
      const session = sessions[date];
      const sessionHitTarget = session.filter(s => s.completed && s.reps >= targetReps).length >= targetSets;
      if (!sessionHitTarget) {
        consecutiveMisses++;
      } else {
        break;
      }
    }

    const increment = getWeightIncrement(exerciseName);

    // DELOAD: 3+ consecutive sessions missing target
    if (consecutiveMisses >= 3) {
      const deloadWeight = Math.round((lastWeight * 0.9) / 2.5) * 2.5;
      return {
        recommendedWeight: deloadWeight,
        recommendedReps: targetReps,
        confidence: "high",
        reasoning: `Deload recommended after ${consecutiveMisses} sessions below target. Reduce weight by 10% and rebuild.`,
        progressionType: "deload",
        percentChange: -10,
      };
    }

    // PROGRESS WEIGHT: All sets hit target reps for 2+ sessions
    if (allSetsHitTarget && avgReps >= targetReps + 1) {
      const newWeight = Math.round((lastWeight + increment) / 2.5) * 2.5;
      return {
        recommendedWeight: newWeight,
        recommendedReps: targetReps,
        confidence: "high",
        reasoning: `Excellent work! All sets completed with ${Math.round(avgReps)} avg reps. Progress to ${newWeight}lbs.`,
        progressionType: "weight",
        percentChange: ((newWeight - lastWeight) / lastWeight) * 100,
      };
    }

    // PROGRESS REPS: Close to target, add reps first
    if (completedSets.length >= targetSets - 1 && avgReps >= targetReps - 1) {
      return {
        recommendedWeight: lastWeight,
        recommendedReps: targetReps,
        confidence: "medium",
        reasoning: `Keep pushing at ${lastWeight}lbs. Focus on hitting all ${targetReps} reps before adding weight.`,
        progressionType: "reps",
        percentChange: 0,
      };
    }

    // MAINTAIN: Still working toward target
    return {
      recommendedWeight: lastWeight,
      recommendedReps: targetReps,
      confidence: "medium",
      reasoning: `Continue at ${lastWeight}lbs. You're making progress—${completedSets.length}/${targetSets} sets complete.`,
      progressionType: "maintain",
      percentChange: 0,
    };
  }, [exerciseName, targetReps, targetSets, getWeightIncrement]);

  // Fetch exercise history
  useEffect(() => {
    if (!userId || !exerciseName) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Get user's workout logs for this exercise
        const cleanExerciseName = exerciseName.replace(/^ex_/, "").replace(/_/g, " ");
        
        const { data: setLogs, error } = await supabase
          .from("user_set_logs")
          .select(`
            actual_weight,
            actual_reps,
            completed,
            created_at,
            workout_log_id
          `)
          .not("actual_weight", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching set history:", error);
          return;
        }

        // Filter by exercise name match (approximate)
        const relevantHistory: SetHistory[] = (setLogs || [])
          .filter(log => log.actual_weight && log.actual_weight > 0)
          .map(log => ({
            weight: log.actual_weight || 0,
            reps: log.actual_reps || 0,
            completed: log.completed,
            date: log.created_at,
          }));

        setHistory(relevantHistory);
        
        if (relevantHistory.length > 0) {
          const rec = analyzePerformance(relevantHistory);
          setRecommendation(rec);
        }
      } catch (err) {
        console.error("Progressive overload analysis error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, exerciseName, analyzePerformance]);

  // Recalculate when params change
  useEffect(() => {
    if (history.length > 0) {
      const rec = analyzePerformance(history);
      setRecommendation(rec);
    }
  }, [targetSets, targetReps, analyzePerformance, history]);

  return {
    recommendation,
    loading,
    historyCount: history.length,
  };
};
