import React from "react";
import { Calendar, Clock, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/hooks/useProgramRecommendations";

interface RecommendedProgramCardProps {
  recommendation: Recommendation;
  onSelect: (programId: string) => void;
  isActive?: boolean;
  canAdd?: boolean;
}

const RecommendedProgramCard: React.FC<RecommendedProgramCardProps> = ({
  recommendation,
  onSelect,
  isActive = false,
  canAdd = true,
}) => {
  const {
    programId,
    programTitle,
    programDescription,
    programType,
    durationWeeks,
    daysPerWeek,
    reason,
    metric,
    currentValue,
    targetValue,
  } = recommendation;

  const typeColors: Record<string, string> = {
    strength: "bg-tactical-blue/20 text-tactical-blue",
    endurance: "bg-green-600/20 text-green-600",
    hybrid: "bg-purple-500/20 text-purple-500",
    conditioning: "bg-tactical-orange/20 text-tactical-orange",
  };

  const colorClass = typeColors[programType] || typeColors.strength;

  const metricIcon = metric === "pushups" ? "💪" : "🏃";
  const metricLabel = metric === "pushups" ? "Push-ups" : "1.5mi Run";

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border-2 border-amber-500/50 p-4 transition-all hover:border-amber-500">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-lg">{programTitle}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
            Recommended
          </Badge>
          <span className={`px-2 py-1 rounded text-xs capitalize ${colorClass}`}>
            {programType}
          </span>
        </div>
      </div>

      {/* Reason Banner */}
      <div className="bg-amber-500/20 rounded-md p-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700 dark:text-amber-300">{reason}</span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {metricIcon} {metricLabel}: <strong className="text-foreground">{currentValue}</strong>
          </span>
          <span>→</span>
          <span>
            Target: <strong className="text-green-600">{metric === "pushups" ? `${targetValue}+` : `under ${targetValue}`}</strong>
          </span>
        </div>
      </div>

      {programDescription && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {programDescription}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          <span>{durationWeeks} weeks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{daysPerWeek} days/wk</span>
        </div>
      </div>

      <Button
        onClick={() => onSelect(programId)}
        variant="default"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        disabled={isActive || (!canAdd && !isActive)}
      >
        {isActive ? "Currently Active" : canAdd ? "Add to Stack" : "Stack Full"}
      </Button>
    </div>
  );
};

export default RecommendedProgramCard;
