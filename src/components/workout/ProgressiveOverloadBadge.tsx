import React from "react";
import { TrendingUp, TrendingDown, Minus, Zap, RefreshCw } from "lucide-react";

interface ProgressiveOverloadBadgeProps {
  progressionType: "weight" | "reps" | "maintain" | "deload";
  recommendedWeight: number;
  percentChange: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

const ProgressiveOverloadBadge: React.FC<ProgressiveOverloadBadgeProps> = ({
  progressionType,
  recommendedWeight,
  percentChange,
  reasoning,
  confidence,
}) => {
  const getIcon = () => {
    switch (progressionType) {
      case "weight":
        return <TrendingUp size={16} className="text-green-400" />;
      case "reps":
        return <Zap size={16} className="text-primary" />;
      case "deload":
        return <TrendingDown size={16} className="text-amber-400" />;
      case "maintain":
      default:
        return <Minus size={16} className="text-muted-foreground" />;
    }
  };

  const getBgColor = () => {
    switch (progressionType) {
      case "weight":
        return "bg-green-500/10 border-green-500/30";
      case "reps":
        return "bg-primary/10 border-primary/30";
      case "deload":
        return "bg-amber-500/10 border-amber-500/30";
      case "maintain":
      default:
        return "bg-secondary/50 border-border";
    }
  };

  const getLabel = () => {
    switch (progressionType) {
      case "weight":
        return "Level Up!";
      case "reps":
        return "Push Reps";
      case "deload":
        return "Deload Week";
      case "maintain":
      default:
        return "Stay Steady";
    }
  };

  const confidenceIndicator = () => {
    const baseClass = "w-1.5 h-1.5 rounded-full";
    switch (confidence) {
      case "high":
        return <span className={`${baseClass} bg-green-400`} title="High confidence" />;
      case "medium":
        return <span className={`${baseClass} bg-amber-400`} title="Medium confidence" />;
      case "low":
        return <span className={`${baseClass} bg-red-400`} title="Low confidence" />;
    }
  };

  if (recommendedWeight === 0) return null;

  return (
    <div className={`p-3 rounded-lg border ${getBgColor()} mb-4 animate-fade-in`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-sm font-semibold">{getLabel()}</span>
          {percentChange !== 0 && (
            <span className={`text-xs font-medium ${percentChange > 0 ? "text-green-400" : "text-amber-400"}`}>
              {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {confidenceIndicator()}
          <span className="text-lg font-bold">{recommendedWeight} lbs</span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        {reasoning}
      </p>
      
      {progressionType === "weight" && (
        <div className="mt-2 flex items-center text-xs text-green-400">
          <RefreshCw size={12} className="mr-1 animate-spin" style={{ animationDuration: "3s" }} />
          Progressive overload in action
        </div>
      )}
    </div>
  );
};

export default ProgressiveOverloadBadge;
