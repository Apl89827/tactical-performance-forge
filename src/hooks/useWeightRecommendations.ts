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
        // Get profile data for 5RM values
        const { data: profile } = await supabase
          .from('profiles')
          .select('bench_5rm, deadlift_5rm, squat_5rm, weight')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          const exerciseKey = exerciseName.toLowerCase();
          
          // Check if exercise matches a main lift
          if (exerciseKey.includes('bench') || exerciseKey.includes('press')) {
            if (profile.bench_5rm) {
              const workingWeight = Math.round((profile.bench_5rm * 0.85) / 5) * 5;
              setRecommendation({
                exerciseName,
                recommendedWeight: workingWeight,
                source: 'profile'
              });
              setLoading(false);
              return;
            }
          }
          
          if (exerciseKey.includes('squat')) {
            if (profile.squat_5rm) {
              const workingWeight = Math.round((profile.squat_5rm * 0.85) / 5) * 5;
              setRecommendation({
                exerciseName,
                recommendedWeight: workingWeight,
                source: 'profile'
              });
              setLoading(false);
              return;
            }
          }
          
          if (exerciseKey.includes('deadlift') || exerciseKey.includes('rdl')) {
            if (profile.deadlift_5rm) {
              const workingWeight = Math.round((profile.deadlift_5rm * 0.85) / 5) * 5;
              setRecommendation({
                exerciseName,
                recommendedWeight: workingWeight,
                source: 'profile'
              });
              setLoading(false);
              return;
            }
          }
        }

        // No profile match found
        setRecommendation(null);
      } catch (error) {
        console.error('Error fetching weight recommendation:', error);
        setRecommendation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [userId, exerciseName]);

  return { recommendation, loading };
};