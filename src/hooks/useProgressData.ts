import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PTMetric {
  date: string;
  runTime?: number;
  pushups?: number;
  situps?: number;
  pullups?: number;
}

interface StrengthMetric {
  date: string;
  exercise: string;
  weight: number;
}

interface WorkoutStats {
  totalCompleted: number;
  totalScheduled: number;
  adherence: number;
  currentWeek: number;
  totalWeeks: number;
}

export const useProgressData = () => {
  const [ptMetrics, setPTMetrics] = useState<PTMetric[]>([]);
  const [strengthMetrics, setStrengthMetrics] = useState<Record<string, StrengthMetric[]>>({});
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    totalCompleted: 0,
    totalScheduled: 0,
    adherence: 0,
    currentWeek: 1,
    totalWeeks: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch PT metrics history
      const { data: ptData } = await supabase
        .from('pt_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });

      if (ptData && ptData.length > 0) {
        const formattedPT = ptData.map(m => ({
          date: new Date(m.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          runTime: m.run_time ? parseRunTime(m.run_time) : undefined,
          pushups: m.pushups || undefined,
          situps: m.situps || undefined,
          pullups: m.pullups || undefined
        }));
        setPTMetrics(formattedPT);
      }

      // Fetch workout completion stats
      const { data: scheduledWorkouts } = await supabase
        .from('user_scheduled_workouts')
        .select('id, status, week_number, program_id')
        .eq('user_id', user.id);

      if (scheduledWorkouts) {
        const completed = scheduledWorkouts.filter(w => w.status === 'completed').length;
        const total = scheduledWorkouts.length;
        const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Calculate current week
        const weeks = scheduledWorkouts.map(w => w.week_number || 1);
        const maxWeek = Math.max(...weeks, 1);

        setWorkoutStats({
          totalCompleted: completed,
          totalScheduled: total,
          adherence,
          currentWeek: maxWeek,
          totalWeeks: 8
        });
      }

      // Fetch strength data from set logs
      const { data: workoutLogs } = await supabase
        .from('user_workout_logs')
        .select('id, completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      if (workoutLogs && workoutLogs.length > 0) {
        // For now, use profile strength metrics directly
        {
          // Group by exercise and find max weights over time
          const strengthByExercise: Record<string, StrengthMetric[]> = {};
          
          // For now, we'll use profile strength metrics
          const { data: profile } = await supabase
            .from('profiles')
            .select('squat_5rm, bench_5rm, deadlift_5rm')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.squat_5rm) {
              strengthByExercise['Squat'] = [{ date: 'Current', exercise: 'Squat', weight: profile.squat_5rm }];
            }
            if (profile.bench_5rm) {
              strengthByExercise['Bench Press'] = [{ date: 'Current', exercise: 'Bench Press', weight: profile.bench_5rm }];
            }
            if (profile.deadlift_5rm) {
              strengthByExercise['Deadlift'] = [{ date: 'Current', exercise: 'Deadlift', weight: profile.deadlift_5rm }];
            }
          }

          setStrengthMetrics(strengthByExercise);
        }
      }

    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ptMetrics, strengthMetrics, workoutStats, loading, refetch: fetchProgressData };
};

// Helper to parse run time string "MM:SS" to decimal minutes
const parseRunTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes + seconds / 60;
  }
  return parseFloat(timeStr) || 0;
};
