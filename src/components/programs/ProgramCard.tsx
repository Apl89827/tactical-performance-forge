import React from "react";
import { Calendar, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramCardProps {
  id: string;
  title: string;
  description: string | null;
  durationWeeks: number;
  daysPerWeek: number;
  programType: string;
  exerciseCount: number;
  onSelect: (programId: string) => void;
  isSelected?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  id,
  title,
  description,
  durationWeeks,
  daysPerWeek,
  programType,
  exerciseCount,
  onSelect,
  isSelected = false,
}) => {
  const typeColors: Record<string, string> = {
    strength: "bg-tactical-blue/20 text-tactical-blue",
    endurance: "bg-green-600/20 text-green-600",
    hybrid: "bg-purple-500/20 text-purple-500",
    conditioning: "bg-tactical-orange/20 text-tactical-orange",
  };

  const colorClass = typeColors[programType] || typeColors.strength;

  return (
    <div 
      className={`bg-card rounded-lg border p-4 transition-all ${
        isSelected ? "border-tactical-blue ring-2 ring-tactical-blue/30" : "border-border"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className={`px-2 py-1 rounded text-xs capitalize ${colorClass}`}>
          {programType}
        </span>
      </div>

      {description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar size={14} />
          <span>{durationWeeks} weeks</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={14} />
          <span>{daysPerWeek} days/wk</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Dumbbell size={14} />
          <span>{exerciseCount} exercises</span>
        </div>
      </div>

      <Button
        onClick={() => onSelect(id)}
        variant={isSelected ? "secondary" : "default"}
        className="w-full"
      >
        {isSelected ? "Selected" : "Start Program"}
      </Button>
    </div>
  );
};

export default ProgramCard;
