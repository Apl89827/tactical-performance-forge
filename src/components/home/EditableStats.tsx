
import React, { useState } from "react";
import { Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditableStatsProps {
  phase: string;
  week: string;
  workouts: string;
  derivedStats: { phase: string; week: string; workouts: string };
  isAdmin: boolean;
  onStatsUpdated: (newStats: { phase: string, week: string, workouts: string }) => void;
}

const EditableStats: React.FC<EditableStatsProps> = ({
  phase,
  week,
  workouts,
  derivedStats,
  isAdmin,
  onStatsUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPhase, setEditedPhase] = useState(phase);
  const [editedWeek, setEditedWeek] = useState(week);
  const [editedWorkouts, setEditedWorkouts] = useState(workouts);

  const handleSave = async () => {
    try {
      // Save to database (in a real app)
      // For now, just update the state through the callback
      onStatsUpdated({
        phase: editedPhase,
        week: editedWeek,
        workouts: editedWorkouts
      });
      
      toast.success("Stats updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving stats:", error);
      toast.error("Failed to update stats");
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedPhase(phase);
    setEditedWeek(week);
    setEditedWorkouts(workouts);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="metric-card flex flex-col">
          <label className="text-xs text-muted-foreground">Phase</label>
          <input
            type="text"
            value={editedPhase}
            onChange={(e) => setEditedPhase(e.target.value)}
            className="text-base font-semibold bg-transparent border-b border-dashed border-muted-foreground p-1 w-full"
          />
        </div>
        <div className="metric-card flex flex-col">
          <label className="text-xs text-muted-foreground">Week</label>
          <input
            type="text"
            value={editedWeek}
            onChange={(e) => setEditedWeek(e.target.value)}
            className="text-base font-semibold bg-transparent border-b border-dashed border-muted-foreground p-1 w-full"
          />
        </div>
        <div className="metric-card flex flex-col">
          <label className="text-xs text-muted-foreground">Workouts</label>
          <input
            type="text"
            value={editedWorkouts}
            onChange={(e) => setEditedWorkouts(e.target.value)}
            className="text-base font-semibold bg-transparent border-b border-dashed border-muted-foreground p-1 w-full"
          />
        </div>
        <div className="col-span-3 flex justify-end space-x-2 mt-2">
          <button onClick={handleCancel} className="p-1 rounded hover:bg-muted">
            <X size={16} className="text-red-500" />
          </button>
          <button onClick={handleSave} className="p-1 rounded hover:bg-muted">
            <Check size={16} className="text-green-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-6 relative">
      <div className="metric-card">
        <span className="text-xs text-muted-foreground">Phase</span>
        <span className="text-base font-semibold">{phase}</span>
        {phase !== derivedStats.phase && (
          <span className="text-xs text-muted-foreground ml-1">(auto: {derivedStats.phase})</span>
        )}
      </div>
      <div className="metric-card">
        <span className="text-xs text-muted-foreground">Week</span>
        <span className="text-base font-semibold">{week}</span>
        {week !== derivedStats.week && (
          <span className="text-xs text-muted-foreground ml-1">(auto: {derivedStats.week})</span>
        )}
      </div>
      <div className="metric-card">
        <span className="text-xs text-muted-foreground">Workouts</span>
        <span className="text-base font-semibold">{workouts}</span>
        {workouts !== derivedStats.workouts && (
          <span className="text-xs text-muted-foreground ml-1">(auto: {derivedStats.workouts})</span>
        )}
      </div>
      
      {isAdmin && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute -top-2 -right-2 p-1 bg-card rounded-full border border-border hover:bg-muted"
        >
          <Edit size={14} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default EditableStats;
