import React from "react";
import { Calendar, Clock, Dumbbell, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProgramCardProps {
  id: string;
  title: string;
  description: string | null;
  durationWeeks: number;
  daysPerWeek: number;
  programType: string;
  exerciseCount: number;
  onSelect: (programId: string) => void;
  onPreview: (programId: string) => void;
  isActive?: boolean;
  canAdd?: boolean;
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
  onPreview,
  isActive = false,
  canAdd = true,
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
      className={`bg-card rounded-lg border p-4 transition-all cursor-pointer hover:border-tactical-blue/50 ${
        isActive ? "border-green-500 ring-2 ring-green-500/30" : "border-border"
      }`}
      onClick={() => onPreview(id)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          {isActive && (
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
              <Check size={12} className="mr-1" /> Active
            </Badge>
          )}
          <Badge variant="secondary" className={`capitalize ${colorClass}`}>
            {programType}
          </Badge>
        </div>
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

      <div className="flex items-center justify-center gap-2 text-sm text-tactical-blue">
        <Eye size={16} />
        <span>Tap to preview</span>
      </div>
    </div>
  );
};

export default ProgramCard;
