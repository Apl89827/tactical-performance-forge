import React, { useState, useMemo, useCallback } from "react";
import { Check, ChevronDown, ChevronUp, Info, Dumbbell, TrendingUp } from "lucide-react";
import { useWeightRecommendations } from "@/hooks/useWeightRecommendations";
import { useProgressiveOverload } from "@/hooks/useProgressiveOverload";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { supabase } from "@/integrations/supabase/client";
import ExerciseVideoLink from "./ExerciseVideoLink";
import ProgressiveOverloadBadge from "./ProgressiveOverloadBadge";

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

const convert5RMto3RM = (fiveRM: number): number => Math.round(fiveRM * 1.069);

const parsePercentageFromNotes = (notes: string): { percentage: number; liftType: "bench" | "squat" | "deadlift" } | null => {
  if (!notes) return null;
  const benchMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:bench|flat\s+bench|bench\s+press)\s*3RM/i);
  if (benchMatch) return { percentage: parseInt(benchMatch[1]), liftType: "bench" };
  const squatMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:back\s+)?squat\s*3RM/i);
  if (squatMatch) return { percentage: parseInt(squatMatch[1]), liftType: "squat" };
  const dlMatch = notes.match(/(\d+)%\s*of\s*(?:your\s+)?(?:conventional\s+)?(?:deadlift|DL)\s*3RM/i);
  if (dlMatch) return { percentage: parseInt(dlMatch[1]), liftType: "deadlift" };
  const genericMatch = notes.match(/(\d+)%\s*of\s*3RM/i);
  if (genericMatch) return { percentage: parseInt(genericMatch[1]), liftType: "bench" };
  return null;
};

const getLiftTypeFromName = (name: string): "bench" | "squat" | "deadlift" | null => {
  const l = name.toLowerCase();
  if (l.includes("bench") || (l.includes("press") && !l.includes("leg"))) return "bench";
  if (l.includes("squat")) return "squat";
  if (l.includes("deadlift") || l.includes("rdl")) return "deadlift";
  return null;
};

const ExerciseCard: React.FC<ExerciseProps> = ({
  id, index, name, sets, notes, restTime, video, isActive,
  isBodyweightPercentage, bodyweightPercentage, userMaxLifts,
  onSetComplete, onSetDataChange, onRestTimerStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [showNotes, setShowNotes] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { triggerHaptic } = useHapticFeedback();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  const { recommendation } = useWeightRecommendations(userId || "", name);
  const targetReps = typeof sets[0]?.targetReps === "number" ? sets[0].targetReps : 8;
  const { recommendation: progressiveRec, historyCount } = useProgressiveOverload({
    userId: userId || "",
    exerciseName: name,
    targetSets: sets.length,
    targetReps,
  });

  const toggleExpand = useCallback(() => {
    setIsExpanded((p) => !p);
    triggerHaptic("light");
  }, [triggerHaptic]);

  const toggleNotes = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotes((p) => !p);
    triggerHaptic("light");
  }, [triggerHaptic]);

  const handleOneTapComplete = useCallback((setIndex: number) => {
    const set = sets[setIndex];
    const newCompleted = !set.isCompleted;
    triggerHaptic(newCompleted ? "success" : "light");
    onSetComplete(index, setIndex, newCompleted);
    if (newCompleted) onRestTimerStart(restTime);
  }, [sets, index, onSetComplete, onRestTimerStart, restTime, triggerHaptic]);

  const weightCalculation = useMemo(() => {
    if (isBodyweightPercentage && bodyweightPercentage && userMaxLifts?.weight) {
      const exact = (userMaxLifts.weight * bodyweightPercentage) / 100;
      return { weight: Math.round(exact / 5) * 5, source: "bodyweight" as const, description: `${bodyweightPercentage}% of ${userMaxLifts.weight} lbs BW` };
    }
    const parsed = parsePercentageFromNotes(notes);
    if (parsed && userMaxLifts) {
      let liftType = parsed.liftType;
      if (!notes.match(/bench|squat|deadlift/i)) {
        const detected = getLiftTypeFromName(name);
        if (detected) liftType = detected;
      }
      let baseRM: number | null = null;
      if (liftType === "bench") baseRM = userMaxLifts.bench_3rm || (userMaxLifts.bench_5rm ? convert5RMto3RM(userMaxLifts.bench_5rm) : null);
      else if (liftType === "squat") baseRM = userMaxLifts.squat_3rm || (userMaxLifts.squat_5rm ? convert5RMto3RM(userMaxLifts.squat_5rm) : null);
      else if (liftType === "deadlift") baseRM = userMaxLifts.deadlift_3rm || (userMaxLifts.deadlift_5rm ? convert5RMto3RM(userMaxLifts.deadlift_5rm) : null);
      if (baseRM) {
        const exact = (baseRM * parsed.percentage) / 100;
        return { weight: Math.round(exact / 5) * 5, source: "3rm_percentage" as const, description: `${parsed.percentage}% of ${baseRM} lbs ${liftType} 3RM` };
      }
    }
    if (progressiveRec && progressiveRec.recommendedWeight > 0) {
      return { weight: progressiveRec.recommendedWeight, source: "progressive" as const, description: progressiveRec.reasoning };
    }
    if (recommendation) {
      return { weight: recommendation.recommendedWeight, source: "ai" as const, description: recommendation.source === "profile" ? "Based on your 5RM data" : "Based on your previous best" };
    }
    return null;
  }, [isBodyweightPercentage, bodyweightPercentage, userMaxLifts, notes, name, recommendation, progressiveRec]);

  const recommendedWeight = weightCalculation?.weight ?? null;

  const missingMaxData = useMemo(() => {
    const parsed = parsePercentageFromNotes(notes);
    if (!parsed || !userMaxLifts) return null;
    let liftType = parsed.liftType;
    if (!notes.match(/bench|squat|deadlift/i)) {
      const detected = getLiftTypeFromName(name);
      if (detected) liftType = detected;
    }
    if (liftType === "bench" && !userMaxLifts.bench_3rm && !userMaxLifts.bench_5rm) return "bench";
    if (liftType === "squat" && !userMaxLifts.squat_3rm && !userMaxLifts.squat_5rm) return "squat";
    if (liftType === "deadlift" && !userMaxLifts.deadlift_3rm && !userMaxLifts.deadlift_5rm) return "deadlift";
    return null;
  }, [notes, name, userMaxLifts]);

  const displayName = name.replace(/^ex_/, "").replace(/_/g, " ");
  const completedSets = sets.filter((s) => s.isCompleted).length;

  return (
    <div className={`bg-card rounded-lg border mb-3 transition-all duration-150 ${isActive ? "border-primary" : "border-border"}`}>
      {/* Header row */}
      <div className="flex justify-between items-center p-4 cursor-pointer" onClick={toggleExpand}>
        <div className="flex items-center">
          <span className={`h-7 w-7 rounded-full flex items-center justify-center mr-3 text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {index + 1}
          </span>
          <div>
            <h3 className="font-medium capitalize">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {completedSets}/{sets.length} sets
              {" · "}
              {typeof sets[0]?.targetReps === "number" && sets[0].targetReps > 0 ? `${sets[0].targetReps} reps` : "AMRAP"}
              {isBodyweightPercentage && bodyweightPercentage && ` · ${bodyweightPercentage}% BW`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {historyCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center">
              <TrendingUp size={10} className="mr-1" />{historyCount}
            </span>
          )}
          <button onClick={toggleNotes} className="p-2 text-muted-foreground hover:text-primary">
            <Info size={18} />
          </button>
          {isExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </div>
      </div>

      {/* Notes */}
      {showNotes && (
        <div className="px-4 pb-2">
          <div className="bg-secondary/50 p-3 rounded-md text-sm">
            <h4 className="font-medium mb-1">Instructions:</h4>
            <p className="text-muted-foreground">{notes}</p>
          </div>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <ExerciseVideoLink exerciseName={name} videoUrl={video} />

          {missingMaxData && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center">
              <Dumbbell className="h-5 w-5 text-amber-500 mr-2 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Set up your {missingMaxData} 3RM in Profile</p>
                <p className="text-xs text-muted-foreground">Add your max lift data to see calculated weights</p>
              </div>
            </div>
          )}

          {progressiveRec && progressiveRec.recommendedWeight > 0 && !missingMaxData && (
            <ProgressiveOverloadBadge
              progressionType={progressiveRec.progressionType}
              recommendedWeight={progressiveRec.recommendedWeight}
              percentChange={progressiveRec.percentChange}
              reasoning={progressiveRec.reasoning}
              confidence={progressiveRec.confidence}
            />
          )}

          {recommendedWeight && !missingMaxData && !progressiveRec?.recommendedWeight && (
            <div className="mb-3 p-3 bg-primary/10 rounded-md flex items-center">
              <Dumbbell className="h-5 w-5 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Recommended: {recommendedWeight} lbs</p>
                <p className="text-xs text-muted-foreground">{weightCalculation?.description}</p>
              </div>
            </div>
          )}

          {/* COMPACT SET ROWS */}
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2">Sets</h4>
            <div className="space-y-1.5">
              {sets.map((set, setIndex) => {
                const suggestedW = progressiveRec?.recommendedWeight || recommendedWeight;
                const hasUserWeight = set.weight !== null;
                const displayWeight = hasUserWeight ? set.weight : suggestedW;
                const isUsingSuggested = !hasUserWeight && !!suggestedW;

                return (
                  <div
                    key={setIndex}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                      set.isCompleted ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                    }`}
                  >
                    {/* Set number */}
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
                      {set.setNumber}
                    </span>

                    {/* Weight input — amber tint when showing suggestion */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={displayWeight ?? ""}
                        onChange={(e) => onSetDataChange(index, setIndex, "weight", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="lbs"
                        className={`w-full h-9 px-2 pr-7 text-center text-sm rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30 ${
                          isUsingSuggested
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            : "bg-background border-border"
                        }`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">lb</span>
                    </div>

                    <span className="text-muted-foreground text-xs shrink-0">×</span>

                    {/* Reps input */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={set.completedReps ?? ""}
                        onChange={(e) => onSetDataChange(index, setIndex, "completedReps", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder={String(set.targetReps) || "max"}
                        className="w-full h-9 px-2 pr-7 text-center text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">rp</span>
                    </div>

                    {/* One-tap complete */}
                    <button
                      onClick={() => handleOneTapComplete(setIndex)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 ${
                        set.isCompleted
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                      aria-label={set.isCompleted ? "Mark incomplete" : "Complete set"}
                    >
                      <Check size={16} strokeWidth={set.isCompleted ? 3 : 2} className={set.isCompleted ? "" : "opacity-40"} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rest timer trigger */}
          <button
            onClick={() => { onRestTimerStart(restTime); triggerHaptic("medium"); }}
            className="w-full p-2.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
