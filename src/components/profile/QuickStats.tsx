import { Activity, Target, Calendar } from "lucide-react";

interface QuickStatsProps {
  workoutsCompleted: number;
  adherence: number;
  currentWeek: number;
  totalWeeks: number;
}

const QuickStats = ({ workoutsCompleted, adherence, currentWeek, totalWeeks }: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
          <Activity size={18} className="text-primary" />
        </div>
        <div className="text-2xl font-bold">{workoutsCompleted}</div>
        <div className="text-xs text-muted-foreground">Workouts</div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 mb-2">
          <Target size={18} className="text-accent" />
        </div>
        <div className="text-2xl font-bold">{adherence}%</div>
        <div className="text-xs text-muted-foreground">Adherence</div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary mb-2">
          <Calendar size={18} className="text-foreground" />
        </div>
        <div className="text-2xl font-bold">
          {currentWeek}/{totalWeeks}
        </div>
        <div className="text-xs text-muted-foreground">Week</div>
      </div>
    </div>
  );
};

export default QuickStats;
