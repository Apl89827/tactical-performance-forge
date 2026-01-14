import React, { useState, useCallback } from "react";
import { Check, ChevronDown, ChevronUp, Info, Timer, MapPin } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import ExerciseVideoLink from "./ExerciseVideoLink";

interface CardioSet {
  setNumber: number;
  targetDistance: number | null;
  targetTime: string | null;
  actualDistance: number | null;
  actualTime: string | null;
  distanceUnit: "miles" | "meters" | "km";
  isCompleted: boolean;
}

interface CardioExerciseProps {
  id: number;
  index: number;
  name: string;
  sets: CardioSet[];
  notes: string;
  restTime: number;
  video: string;
  isActive: boolean;
  targetDistance?: number | null;
  targetTime?: string | null;
  targetPace?: string | null;
  distanceUnit?: "miles" | "meters" | "km";
  onSetComplete: (exerciseIndex: number, setIndex: number, isCompleted: boolean) => void;
  onSetDataChange: (exerciseIndex: number, setIndex: number, field: string, value: any) => void;
  onRestTimerStart: (seconds: number) => void;
}

// Calculate pace from distance and time
const calculatePace = (distance: number | null, timeStr: string | null, unit: string): string | null => {
  if (!distance || !timeStr || distance <= 0) return null;
  
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1]);
  const totalMinutes = minutes + seconds / 60;
  
  const paceMinutes = totalMinutes / distance;
  const paceMins = Math.floor(paceMinutes);
  const paceSecs = Math.round((paceMinutes - paceMins) * 60);
  
  return `${paceMins}:${paceSecs.toString().padStart(2, "0")}/${unit}`;
};

// Format time display
const formatTimeDisplay = (timeStr: string | null): string => {
  if (!timeStr) return "--:--";
  return timeStr;
};

const CardioExerciseCard: React.FC<CardioExerciseProps> = ({
  id,
  index,
  name,
  sets,
  notes,
  restTime,
  video,
  isActive,
  targetDistance,
  targetTime,
  targetPace,
  distanceUnit = "miles",
  onSetComplete,
  onSetDataChange,
  onRestTimerStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [showNotes, setShowNotes] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    triggerHaptic("light");
  }, [triggerHaptic]);

  const toggleNotes = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowNotes((prev) => !prev);
      triggerHaptic("light");
    },
    [triggerHaptic]
  );

  const handleOneTapComplete = useCallback(
    (setIndex: number) => {
      const set = sets[setIndex];
      const newCompleted = !set.isCompleted;

      if (newCompleted) {
        triggerHaptic("success");
      } else {
        triggerHaptic("light");
      }

      onSetComplete(index, setIndex, newCompleted);

      if (newCompleted) {
        onRestTimerStart(restTime);
      }
    },
    [sets, index, onSetComplete, onRestTimerStart, restTime, triggerHaptic]
  );

  const displayName = name.replace(/^ex_/, "").replace(/_/g, " ");
  const completedSets = sets.filter((s) => s.isCompleted).length;

  // Get unit abbreviation
  const unitAbbr = distanceUnit === "miles" ? "mi" : distanceUnit === "km" ? "km" : "m";

  return (
    <div
      className={`bg-card rounded-lg border mb-4 transition-all duration-150 ${
        isActive ? "border-primary" : "border-border"
      }`}
    >
      <div className="flex justify-between items-center p-4 cursor-pointer" onClick={toggleExpand}>
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
              {completedSets}/{sets.length} {sets.length === 1 ? "round" : "rounds"}
              {targetDistance && (
                <span className="ml-1">
                  • {targetDistance} {unitAbbr}
                </span>
              )}
              {targetTime && <span className="ml-1">• Target: {targetTime}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={toggleNotes} className="p-2 text-muted-foreground hover:text-primary">
            <Info size={18} />
          </button>
          {isExpanded ? (
            <ChevronUp size={20} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground" />
          )}
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
          {/* Video Link */}
          <ExerciseVideoLink exerciseName={name} videoUrl={video} />

          {/* Target Info */}
          {(targetDistance || targetTime || targetPace) && (
            <div className="mb-4 p-3 bg-primary/10 rounded-md">
              <div className="flex items-center justify-between text-sm">
                {targetDistance && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-primary mr-1" />
                    <span className="font-medium">
                      {targetDistance} {unitAbbr}
                    </span>
                  </div>
                )}
                {targetTime && (
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 text-primary mr-1" />
                    <span className="font-medium">Target: {targetTime}</span>
                  </div>
                )}
                {targetPace && (
                  <div className="text-xs text-muted-foreground">Pace: {targetPace}</div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-3">
              {sets.length === 1 ? "Your Run:" : "Rounds:"}
            </h4>
            <div className="space-y-3">
              {sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className={`p-3 rounded-md transition-all ${
                    set.isCompleted ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                  }`}
                >
                  {sets.length > 1 && (
                    <div className="text-xs text-muted-foreground mb-2">Round {set.setNumber}</div>
                  )}

                  <div className="flex items-center space-x-3">
                    {/* Distance Input */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground block mb-1">Distance</label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={set.actualDistance ?? ""}
                          onChange={(e) =>
                            onSetDataChange(
                              index,
                              setIndex,
                              "actualDistance",
                              e.target.value === "" ? null : parseFloat(e.target.value)
                            )
                          }
                          className="w-full p-2 pr-8 text-center rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          placeholder={targetDistance?.toString() || unitAbbr}
                        />
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">
                          {unitAbbr}
                        </span>
                      </div>
                    </div>

                    {/* Time Input */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground block mb-1">Time</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={set.actualTime || ""}
                          onChange={(e) =>
                            onSetDataChange(index, setIndex, "actualTime", e.target.value)
                          }
                          className="w-full p-2 text-center rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          placeholder={targetTime || "MM:SS"}
                        />
                      </div>
                    </div>

                    {/* Complete Button */}
                    <div className="pt-5">
                      <button
                        onClick={() => handleOneTapComplete(setIndex)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                          set.isCompleted
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                        aria-label={set.isCompleted ? "Mark incomplete" : "Complete"}
                      >
                        {set.isCompleted ? (
                          <Check size={22} strokeWidth={3} />
                        ) : (
                          <Check size={20} className="opacity-50" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Calculated Pace */}
                  {set.actualDistance && set.actualTime && (
                    <div className="mt-2 text-xs text-center text-muted-foreground">
                      Pace: {calculatePace(set.actualDistance, set.actualTime, unitAbbr) || "--"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onRestTimerStart(restTime);
              triggerHaptic("medium");
            }}
            className="w-full p-3 text-sm bg-secondary hover:bg-secondary/80 rounded-md flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
          >
            <Timer size={16} />
            <span>Start {restTime >= 60 ? `${restTime / 60} min` : `${restTime}s`} rest</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CardioExerciseCard;
