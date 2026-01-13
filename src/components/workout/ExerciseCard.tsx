import React, { useState, useMemo } from "react";
import { Check, ChevronDown, ChevronUp, Play, Info, Dumbbell } from "lucide-react";
import { useWeightRecommendations } from "@/hooks/useWeightRecommendations";
import { supabase } from "@/integrations/supabase/client";
interface ExerciseSet {
  setNumber: number;
  targetReps: string | number;
  weight: number | null;
  completedReps: string | number | null;
  isCompleted: boolean;
}

interface UserMaxLifts {
  weight: number | null;
  bench_3rm: number | null;
  deadlift_3rm: number | null;
  squat_3rm: number | null;
  bench_5rm: number | null;
  deadlift_5rm: number | null;
  squat_5rm: number | null;
}

interface ExerciseProps {
  id: number;
  index: number;
  name: string;
  sets: ExerciseSet[];
  notes: string;
  restTime: number;
  video: string;
  isActive: boolean;
  isBodyweightPercentage?: boolean;
  bodyweightPercentage?: number;
  userMaxLifts?: UserMaxLifts;
  onSetComplete: (exerciseIndex: number, setIndex: number, isCompleted: boolean) => void;
  onSetDataChange: (exerciseIndex: number, setIndex: number, field: string, value: any) => void;
  onRestTimerStart: (seconds: number) => void;
}

// Helper to convert 5RM to 3RM using Epley formula
const convert5RMto3RM = (fiveRM: number): number => {
  return Math.round(fiveRM * 1.069);
};

// Parse percentage from notes like "90% of 3RM"
const parsePercentageFromNotes = (notes: string): { percentage: number; liftType: 'bench' | 'squat' | 'deadlift' } | null => {
  if (!notes) return null;
  
  const benchMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:bench|flat\s+bench|bench\s+press)\s*3RM/i);
  if (benchMatch) return { percentage: parseInt(benchMatch[1]), liftType: 'bench' };
  
  const squatMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:back\s+)?squat\s*3RM/i);
  if (squatMatch) return { percentage: parseInt(squatMatch[1]), liftType: 'squat' };
  
  const dlMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:conventional\s+)?(?:deadlift|DL)\s*3RM/i);
  if (dlMatch) return { percentage: parseInt(dlMatch[1]), liftType: 'deadlift' };
  
  const genericMatch = notes.match(/(\d+)%\s*of\s*3RM/i);
  if (genericMatch) return { percentage: parseInt(genericMatch[1]), liftType: 'bench' };

  return null;
};

// Determine lift type from exercise name
const getLiftTypeFromName = (name: string): 'bench' | 'squat' | 'deadlift' | null => {
  const lowName = name.toLowerCase();
  
  if (lowName.includes('bench') || (lowName.includes('press') && !lowName.includes('leg'))) {
    return 'bench';
  }
  if (lowName.includes('squat')) {
    return 'squat';
  }
  if (lowName.includes('deadlift') || lowName.includes('rdl')) {
    return 'deadlift';
  }
  
  return null;
};

const ExerciseCard: React.FC<ExerciseProps> = ({
  id,
  index,
  name,
  sets,
  notes,
  restTime,
  video,
  isActive,
  isBodyweightPercentage,
  bodyweightPercentage,
  userMaxLifts,
  onSetComplete,
  onSetDataChange,
  onRestTimerStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [showNotes, setShowNotes] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const { recommendation } = useWeightRecommendations(userId || '', name);
  
  const toggleExpand = () => setIsExpanded(!isExpanded);
  const toggleNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotes(!showNotes);
  };
  
  // Calculate the recommended weight
  const weightCalculation = useMemo(() => {
    // Bodyweight percentage
    if (isBodyweightPercentage && bodyweightPercentage && userMaxLifts?.weight) {
      const exactWeight = (userMaxLifts.weight * bodyweightPercentage) / 100;
      return {
        weight: Math.round(exactWeight / 5) * 5,
        source: 'bodyweight' as const,
        description: `${bodyweightPercentage}% of ${userMaxLifts.weight} lbs bodyweight`,
      };
    }

    // Parse percentage from notes
    const parsedPercentage = parsePercentageFromNotes(notes);
    if (parsedPercentage && userMaxLifts) {
      let baseRM: number | null = null;
      let liftType = parsedPercentage.liftType;
      
      // Try to detect from name if generic
      if (!notes.match(/bench|squat|deadlift/i)) {
        const detectedType = getLiftTypeFromName(name);
        if (detectedType) liftType = detectedType;
      }
      
      if (liftType === 'bench') {
        baseRM = userMaxLifts.bench_3rm || (userMaxLifts.bench_5rm ? convert5RMto3RM(userMaxLifts.bench_5rm) : null);
      } else if (liftType === 'squat') {
        baseRM = userMaxLifts.squat_3rm || (userMaxLifts.squat_5rm ? convert5RMto3RM(userMaxLifts.squat_5rm) : null);
      } else if (liftType === 'deadlift') {
        baseRM = userMaxLifts.deadlift_3rm || (userMaxLifts.deadlift_5rm ? convert5RMto3RM(userMaxLifts.deadlift_5rm) : null);
      }
      
      if (baseRM) {
        const exactWeight = (baseRM * parsedPercentage.percentage) / 100;
        return {
          weight: Math.round(exactWeight / 5) * 5,
          source: '3rm_percentage' as const,
          description: `${parsedPercentage.percentage}% of ${baseRM} lbs ${liftType} 3RM`,
        };
      }
    }

    // AI recommendation
    if (recommendation) {
      return {
        weight: recommendation.recommendedWeight,
        source: 'ai' as const,
        description: recommendation.source === 'profile' ? 'Based on your 5RM data' : 'Based on your previous best',
      };
    }

    return null;
  }, [isBodyweightPercentage, bodyweightPercentage, userMaxLifts, notes, name, recommendation]);

  const recommendedWeight = weightCalculation?.weight ?? null;
  
  // Check if missing max data
  const missingMaxData = useMemo(() => {
    const parsedPercentage = parsePercentageFromNotes(notes);
    if (!parsedPercentage || !userMaxLifts) return null;
    
    let liftType = parsedPercentage.liftType;
    if (!notes.match(/bench|squat|deadlift/i)) {
      const detectedType = getLiftTypeFromName(name);
      if (detectedType) liftType = detectedType;
    }
    
    if (liftType === 'bench' && !userMaxLifts.bench_3rm && !userMaxLifts.bench_5rm) return 'bench';
    if (liftType === 'squat' && !userMaxLifts.squat_3rm && !userMaxLifts.squat_5rm) return 'squat';
    if (liftType === 'deadlift' && !userMaxLifts.deadlift_3rm && !userMaxLifts.deadlift_5rm) return 'deadlift';
    
    return null;
  }, [notes, name, userMaxLifts]);

  const displayName = name.replace(/^ex_/, '').replace(/_/g, ' ');
  
  return (
    <div 
      className={`bg-card rounded-lg border mb-4 transition-all duration-150 ${
        isActive ? "border-primary" : "border-border"
      }`}
    >
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <span 
            className={`h-7 w-7 rounded-full flex items-center justify-center mr-3 text-xs ${
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {index + 1}
          </span>
          <div>
            <h3 className="font-medium capitalize">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {sets.length} sets • {typeof sets[0]?.targetReps === 'number' && sets[0].targetReps > 0 ? `${sets[0].targetReps} reps` : 'AMRAP'}
              {isBodyweightPercentage && bodyweightPercentage && (
                <span className="ml-1">• {bodyweightPercentage}% BW</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={toggleNotes} className="p-2 text-muted-foreground hover:text-primary">
            <Info size={18} />
          </button>
          {isExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </div>
      </div>
      
      {showNotes && (
        <div className="px-4 pb-2">
          <div className="bg-secondary/50 p-3 rounded-md text-sm">
            <h4 className="font-medium mb-1">Instructions:</h4>
            <p className="text-muted-foreground">{notes}</p>
          </div>
        </div>
      )}
      
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="aspect-video bg-primary/10 mb-4 rounded-md flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
            <div className="flex flex-col items-center">
              <Play size={32} className="text-primary mb-1" />
              <span className="text-xs text-muted-foreground">Tap to view demonstration</span>
            </div>
          </div>
          
          {missingMaxData && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center">
              <Dumbbell className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Set up your {missingMaxData} 3RM in Profile
                </p>
                <p className="text-xs text-muted-foreground">Add your max lift data to see calculated weights</p>
              </div>
            </div>
          )}
          
          {recommendedWeight && !missingMaxData && (
            <div className="mb-4 p-3 bg-primary/10 rounded-md flex items-center">
              <Dumbbell className="h-5 w-5 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Recommended: {recommendedWeight} lbs</p>
                <p className="text-xs text-muted-foreground">{weightCalculation?.description}</p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-3">Sets:</h4>
            <div className="space-y-3">
              {sets.map((set, setIndex) => (
                <div 
                  key={setIndex} 
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    set.isCompleted ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                  }`}
                >
                  <div className="w-6 text-center">
                    <span className="text-sm font-medium">{set.setNumber}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={set.weight !== null ? set.weight : (recommendedWeight || '')}
                          onChange={(e) => onSetDataChange(index, setIndex, "weight", e.target.value)}
                          className="w-16 p-2 text-center rounded bg-background border border-border"
                          placeholder={recommendedWeight ? String(recommendedWeight) : "lbs"}
                        />
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">lbs</span>
                      </div>
                      <span className="text-sm text-muted-foreground">×</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={set.completedReps || ""}
                          onChange={(e) => onSetDataChange(index, setIndex, "completedReps", e.target.value)}
                          className="w-full p-2 text-center rounded bg-background border border-border"
                          placeholder={String(set.targetReps) || "max"}
                        />
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">reps</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSetComplete(index, setIndex, !set.isCompleted);
                      if (!set.isCompleted) onRestTimerStart(restTime);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      set.isCompleted ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {set.isCompleted && <Check size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => onRestTimerStart(restTime)}
            className="w-full p-3 text-sm bg-secondary hover:bg-secondary/80 rounded-md flex items-center justify-center space-x-2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6v6l4 2M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Start {restTime / 60} min rest</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
