import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeightRecommendation {
  exerciseName: string;
  recommendedWeight: number;
  source: 'profile' | 'previous_best' | 'bodyweight';
}

export const useWeightRecommendations = (userId: string, exerciseName: string) => {
  const [recommendation, setRecommendation] = useState<WeightRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!userId || !exerciseName) return;
      
      setLoading(true);
      try {
        // First try to get from profile (1RM data)
        const { data: profile } = await supabase
          .from('profiles')
          .select('bench_5rm, deadlift_5rm, squat_5rm, weight')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          // Check if exercise matches a main lift
          const liftMap: Record<string, number | null> = {
            'bench press': profile.bench_5rm,
            'deadlift': profile.deadlift_5rm,
            'squat': profile.squat_5rm,
          };

          const exerciseKey = exerciseName.toLowerCase();
          const matchingLift = Object.keys(liftMap).find(lift => 
            exerciseKey.includes(lift) || lift.includes(exerciseKey)
          );

          if (matchingLift && liftMap[matchingLift]) {
            // Convert 5RM to working weight (approximately 85% of 5RM)
            const workingWeight = Math.round((liftMap[matchingLift]! * 0.85) / 5) * 5;
            setRecommendation({
              exerciseName,
              recommendedWeight: workingWeight,
              source: 'profile'
            });
            setLoading(false);
            return;
          }
        }

        // If no profile match, try to get previous best from set logs
        const { data: setLogs } = await supabase
          .from('user_set_logs')
          .select(`
            actual_weight,
            actual_reps,
            user_workout_logs!inner(
              user_scheduled_workouts!inner(
                user_id,
                exercises
              )
            )
          `)
          .eq('user_workout_logs.user_scheduled_workouts.user_id', userId)
          .not('actual_weight', 'is', null)
          .order('created_at', { ascending: false });

        if (setLogs && setLogs.length > 0) {
          // Find sets for this exercise and get the best weight
          const exerciseSets = setLogs.filter((log: any) => {
            const workouts = log.user_workout_logs?.user_scheduled_workouts;
            if (!workouts?.exercises) return false;
            
            return workouts.exercises.some((ex: any) => 
              ex.movement_name?.toLowerCase().includes(exerciseName.toLowerCase())
            );
          });

          if (exerciseSets.length > 0) {
            const bestWeight = Math.max(...exerciseSets.map((set: any) => set.actual_weight || 0));
            setRecommendation({
              exerciseName,
              recommendedWeight: bestWeight,
              source: 'previous_best'
            });
          }
        }

      } catch (error) {
        console.error('Error fetching weight recommendation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [userId, exerciseName]);

  return { recommendation, loading };
};