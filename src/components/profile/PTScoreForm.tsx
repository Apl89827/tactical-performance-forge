
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PTScoreFormProps {
  userId: string;
  initialValues: {
    runTime?: string;
    pushups?: number;
    situps?: number;
    pullups?: number;
    swimTime?: string;
    bench5rm?: number;
    deadlift5rm?: number;
    squat5rm?: number;
    bench3rm?: number;
    deadlift3rm?: number;
    squat3rm?: number;
  };
  onComplete: () => void;
}

const PTScoreForm: React.FC<PTScoreFormProps> = ({ userId, initialValues, onComplete }) => {
  const [runTime, setRunTime] = useState(initialValues.runTime || '');
  const [pushups, setPushups] = useState(initialValues.pushups || '');
  const [situps, setSitups] = useState(initialValues.situps || '');
  const [pullups, setPullups] = useState(initialValues.pullups || '');
  const [swimTime, setSwimTime] = useState(initialValues.swimTime || '');
  const [bench5rm, setBench5rm] = useState(initialValues.bench5rm || '');
  const [deadlift5rm, setDeadlift5rm] = useState(initialValues.deadlift5rm || '');
  const [squat5rm, setSquat5rm] = useState(initialValues.squat5rm || '');
  const [bench3rm, setBench3rm] = useState(initialValues.bench3rm || '');
  const [deadlift3rm, setDeadlift3rm] = useState(initialValues.deadlift3rm || '');
  const [squat3rm, setSquat3rm] = useState(initialValues.squat3rm || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store PT scores in the database (strength + swim on profiles)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          swim_time: swimTime,
          bench_5rm: bench5rm ? parseInt(bench5rm.toString()) : null,
          deadlift_5rm: deadlift5rm ? parseInt(deadlift5rm.toString()) : null,
          squat_5rm: squat5rm ? parseInt(squat5rm.toString()) : null,
          bench_3rm: bench3rm ? parseInt(bench3rm.toString()) : null,
          deadlift_3rm: deadlift3rm ? parseInt(deadlift3rm.toString()) : null,
          squat_3rm: squat3rm ? parseInt(squat3rm.toString()) : null
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Insert a PT metrics snapshot (baseline/progress)
      const { error: metricsError } = await supabase
        .from('pt_metrics')
        .insert({
          user_id: userId,
          run_time: runTime || null,
          pushups: pushups ? parseInt(pushups.toString()) : null,
          situps: situps ? parseInt(situps.toString()) : null,
          pullups: pullups ? parseInt(pullups.toString()) : null,
        });

      if (metricsError) throw metricsError;

      // Maintain legacy localStorage for backwards compatibility
      const ptScores = {
        runTime,
        pushups: pushups ? parseInt(pushups.toString()) : 0,
        situps: situps ? parseInt(situps.toString()) : 0,
        pullups: pullups ? parseInt(pullups.toString()) : 0
      };

      // Get existing profile data
      const storedData = localStorage.getItem("profileData");
      const existingData = storedData ? JSON.parse(storedData) : {};
      
      // Update with new PT scores
      localStorage.setItem("profileData", JSON.stringify({
        ...existingData,
        ptScores
      }));

      toast.success("PT scores updated successfully");
      onComplete();
    } catch (error) {
      console.error("Error updating PT scores:", error);
      toast.error("Failed to update PT scores");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="runTime" className="text-sm font-medium mb-1 block">
            1.5 Mile Run Time
          </label>
          <Input
            id="runTime"
            type="text"
            value={runTime}
            onChange={(e) => setRunTime(e.target.value)}
            placeholder="e.g., 10:30"
          />
        </div>
        <div>
          <label htmlFor="swimTime" className="text-sm font-medium mb-1 block">
            500m Swim (50m splits)
          </label>
          <Input
            id="swimTime"
            type="text"
            value={swimTime}
            onChange={(e) => setSwimTime(e.target.value)}
            placeholder="e.g., 8:45"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pushups" className="text-sm font-medium mb-1 block">
            Max Push-ups (2 min)
          </label>
          <Input
            id="pushups"
            type="number"
            value={pushups}
            onChange={(e) => setPushups(e.target.value)}
            placeholder="e.g., 50"
          />
        </div>
        <div>
          <label htmlFor="situps" className="text-sm font-medium mb-1 block">
            Max Sit-ups (2 min)
          </label>
          <Input
            id="situps"
            type="number"
            value={situps}
            onChange={(e) => setSitups(e.target.value)}
            placeholder="e.g., 60"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pullups" className="text-sm font-medium mb-1 block">
            Max Pull-ups
          </label>
          <Input
            id="pullups"
            type="number"
            value={pullups}
            onChange={(e) => setPullups(e.target.value)}
            placeholder="e.g., 10"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <h3 className="font-medium mb-2">Strength Metrics (3RM) - For SFAS Program</h3>
        <p className="text-xs text-muted-foreground mb-3">Used to calculate percentage-based weights in the SFAS program</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="bench3rm" className="text-sm font-medium mb-1 block">
            Bench 3RM (lbs)
          </label>
          <Input
            id="bench3rm"
            type="number"
            value={bench3rm}
            onChange={(e) => setBench3rm(e.target.value)}
            placeholder="e.g., 200"
          />
        </div>
        <div>
          <label htmlFor="squat3rm" className="text-sm font-medium mb-1 block">
            Squat 3RM (lbs)
          </label>
          <Input
            id="squat3rm"
            type="number"
            value={squat3rm}
            onChange={(e) => setSquat3rm(e.target.value)}
            placeholder="e.g., 295"
          />
        </div>
        <div>
          <label htmlFor="deadlift3rm" className="text-sm font-medium mb-1 block">
            Deadlift 3RM (lbs)
          </label>
          <Input
            id="deadlift3rm"
            type="number"
            value={deadlift3rm}
            onChange={(e) => setDeadlift3rm(e.target.value)}
            placeholder="e.g., 335"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <h3 className="font-medium mb-2">Strength Metrics (5RM)</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="bench5rm" className="text-sm font-medium mb-1 block">
            Bench 5RM (lbs)
          </label>
          <Input
            id="bench5rm"
            type="number"
            value={bench5rm}
            onChange={(e) => setBench5rm(e.target.value)}
            placeholder="e.g., 185"
          />
        </div>
        <div>
          <label htmlFor="squat5rm" className="text-sm font-medium mb-1 block">
            Squat 5RM (lbs)
          </label>
          <Input
            id="squat5rm"
            type="number"
            value={squat5rm}
            onChange={(e) => setSquat5rm(e.target.value)}
            placeholder="e.g., 275"
          />
        </div>
        <div>
          <label htmlFor="deadlift5rm" className="text-sm font-medium mb-1 block">
            Deadlift 5RM (lbs)
          </label>
          <Input
            id="deadlift5rm"
            type="number"
            value={deadlift5rm}
            onChange={(e) => setDeadlift5rm(e.target.value)}
            placeholder="e.g., 315"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onComplete}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Saving..." : "Save PT Scores"}
        </Button>
      </div>
    </form>
  );
};

export default PTScoreForm;
