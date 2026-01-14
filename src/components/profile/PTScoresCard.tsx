import { FileEdit, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PTScoreForm from "./PTScoreForm";

interface PTScoresCardProps {
  userId: string;
  ptScores?: {
    runTime?: string;
    pushups?: number;
    situps?: number;
    pullups?: number;
  };
  swimTime?: string | null;
  bench3rm?: number | null;
  squat3rm?: number | null;
  deadlift3rm?: number | null;
  bench5rm?: number | null;
  squat5rm?: number | null;
  deadlift5rm?: number | null;
  isEditing: boolean;
  onEdit: () => void;
  onComplete: () => void;
}

const PTScoresCard = ({
  userId,
  ptScores,
  swimTime,
  bench3rm,
  squat3rm,
  deadlift3rm,
  bench5rm,
  squat5rm,
  deadlift5rm,
  isEditing,
  onEdit,
  onComplete
}: PTScoresCardProps) => {
  const [strengthOpen, setStrengthOpen] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-primary" />
          <h2 className="font-semibold">PT Scores</h2>
        </div>
        {!isEditing && (
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={onEdit}
          >
            <FileEdit size={16} className="text-primary" />
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="p-4">
          <PTScoreForm 
            userId={userId}
            initialValues={{
              runTime: ptScores?.runTime,
              pushups: ptScores?.pushups,
              situps: ptScores?.situps,
              pullups: ptScores?.pullups,
              swimTime: swimTime || '',
              bench5rm: bench5rm || undefined,
              deadlift5rm: deadlift5rm || undefined,
              squat5rm: squat5rm || undefined,
              bench3rm: bench3rm || undefined,
              deadlift3rm: deadlift3rm || undefined,
              squat3rm: squat3rm || undefined
            }}
            onComplete={onComplete}
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">1.5 Mile Run</span>
            <span className="font-medium">{ptScores?.runTime || "--"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">500m Swim</span>
            <span className="font-medium">{swimTime || "--"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Push-ups</span>
            <span className="font-medium">{ptScores?.pushups || "--"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Sit-ups</span>
            <span className="font-medium">{ptScores?.situps || "--"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Pull-ups</span>
            <span className="font-medium">{ptScores?.pullups || "--"}</span>
          </div>
          
          <Collapsible open={strengthOpen} onOpenChange={setStrengthOpen}>
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <span className="font-medium">Strength Metrics</span>
              {strengthOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">3RM (for SFAS calculations)</p>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground text-sm">Bench Press</span>
                <span className="font-medium">{bench3rm ? `${bench3rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground text-sm">Squat</span>
                <span className="font-medium">{squat3rm ? `${squat3rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground text-sm">Deadlift</span>
                <span className="font-medium">{deadlift3rm ? `${deadlift3rm} lbs` : "--"}</span>
              </div>
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground mb-2">5RM</p>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground text-sm">Bench Press</span>
                <span className="font-medium">{bench5rm ? `${bench5rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-muted-foreground text-sm">Squat</span>
                <span className="font-medium">{squat5rm ? `${squat5rm} lbs` : "--"}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 pb-4">
                <span className="text-muted-foreground text-sm">Deadlift</span>
                <span className="font-medium">{deadlift5rm ? `${deadlift5rm} lbs` : "--"}</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

export default PTScoresCard;
