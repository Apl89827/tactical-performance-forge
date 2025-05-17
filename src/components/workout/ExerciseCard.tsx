
import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Play, Info, Percent } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ExerciseSet {
  setNumber: number;
  targetReps: string | number;
  weight: number | null;
  completedReps: string | number | null;
  isCompleted: boolean;
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
  userWeight?: number;
  onSetComplete: (exerciseIndex: number, setIndex: number, isCompleted: boolean) => void;
  onSetDataChange: (exerciseIndex: number, setIndex: number, field: string, value: any) => void;
  onRestTimerStart: (seconds: number) => void;
}

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
  userWeight,
  onSetComplete,
  onSetDataChange,
  onRestTimerStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [showNotes, setShowNotes] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const toggleNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotes(!showNotes);
  };
  
  // Calculate the recommended weight if it's based on body weight percentage
  const calculateRecommendedWeight = () => {
    if (isBodyweightPercentage && bodyweightPercentage && userWeight) {
      // Calculate weight and round to nearest 5
      const exactWeight = (userWeight * bodyweightPercentage) / 100;
      return Math.round(exactWeight / 5) * 5;
    }
    return null;
  };

  const recommendedWeight = calculateRecommendedWeight();
  
  return (
    <div 
      className={`bg-card rounded-lg border mb-4 transition-all duration-150 ${
        isActive ? "border-tactical-blue" : "border-border"
      }`}
    >
      {/* Exercise header */}
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <span 
            className={`h-7 w-7 rounded-full flex items-center justify-center mr-3 text-xs
              ${isActive 
                ? "bg-tactical-blue text-white" 
                : "bg-secondary text-muted-foreground"}`
            }
          >
            {index + 1}
          </span>
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-xs text-muted-foreground">
              {sets.length} sets • {typeof sets[0].targetReps === 'number' ? `${sets[0].targetReps} reps` : sets[0].targetReps}
              {isBodyweightPercentage && bodyweightPercentage && (
                <span> • <Badge variant="success" className="ml-1">{bodyweightPercentage}% BW</Badge></span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleNotes} 
            className="p-2 text-muted-foreground hover:text-tactical-blue"
          >
            <Info size={18} />
          </button>
          {isExpanded ? (
            <ChevronUp size={20} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Notes tooltip */}
      {showNotes && (
        <div className="px-4 pb-2">
          <div className="bg-secondary/50 p-3 rounded-md text-sm">
            <h4 className="font-medium mb-1">Form Notes:</h4>
            <p className="text-muted-foreground">{notes}</p>
          </div>
        </div>
      )}
      
      {/* Exercise content when expanded */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          {/* Video placeholder */}
          <div 
            className="aspect-video bg-tactical-blue/10 mb-4 rounded-md flex items-center justify-center cursor-pointer hover:bg-tactical-blue/20 transition-colors overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            <div className="z-10 flex flex-col items-center">
              <Play size={32} className="text-tactical-blue mb-1" />
              <span className="text-xs text-muted-foreground">Tap to view demonstration</span>
            </div>
          </div>
          
          {/* Bodyweight percentage info */}
          {isBodyweightPercentage && bodyweightPercentage && recommendedWeight && (
            <div className="mb-4 p-3 bg-tactical-blue/10 rounded-md flex items-center">
              <Percent className="h-5 w-5 text-tactical-blue mr-2" />
              <div>
                <p className="text-sm font-medium">Recommended weight: {recommendedWeight} lbs</p>
                <p className="text-xs text-muted-foreground">Based on {bodyweightPercentage}% of your body weight</p>
              </div>
            </div>
          )}
          
          {/* Sets */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-3">Sets:</h4>
            
            <div className="space-y-3">
              {sets.map((set, setIndex) => (
                <div 
                  key={setIndex} 
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    set.isCompleted 
                      ? "bg-tactical-blue/10 border border-tactical-blue/30" 
                      : "bg-secondary/30"
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
                          value={set.weight !== null ? set.weight : recommendedWeight || ''}
                          onChange={(e) => onSetDataChange(index, setIndex, "weight", e.target.value)}
                          className="w-16 p-2 text-center rounded bg-background border border-border"
                          placeholder={recommendedWeight ? recommendedWeight.toString() : "lbs"}
                        />
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">
                          lbs
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">×</span>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={set.completedReps || ""}
                          onChange={(e) => onSetDataChange(index, setIndex, "completedReps", e.target.value)}
                          className="w-full p-2 text-center rounded bg-background border border-border"
                          placeholder={set.targetReps.toString()}
                        />
                        <span className="absolute right-2 top-2 text-xs text-muted-foreground pointer-events-none">
                          reps
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSetComplete(index, setIndex, !set.isCompleted);
                      if (!set.isCompleted) {
                        onRestTimerStart(restTime);
                      }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      set.isCompleted
                        ? "bg-tactical-blue text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {set.isCompleted && <Check size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Rest timer button */}
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
