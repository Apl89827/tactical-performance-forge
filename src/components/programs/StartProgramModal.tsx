import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StartProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    id: string;
    title: string;
    durationWeeks: number;
    daysPerWeek: number;
  } | null;
  onConfirm: (programId: string, startDate: Date) => void;
  isLoading?: boolean;
}

interface MaxLifts {
  bench_3rm: number | null;
  squat_3rm: number | null;
  deadlift_3rm: number | null;
}

const StartProgramModal: React.FC<StartProgramModalProps> = ({
  open,
  onOpenChange,
  program,
  onConfirm,
  isLoading = false,
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [maxLifts, setMaxLifts] = useState<MaxLifts>({ bench_3rm: null, squat_3rm: null, deadlift_3rm: null });
  const [loadingLifts, setLoadingLifts] = useState(false);
  const [showLiftInputs, setShowLiftInputs] = useState(false);
  const [bench3rm, setBench3rm] = useState<string>("");
  const [squat3rm, setSquat3rm] = useState<string>("");
  const [deadlift3rm, setDeadlift3rm] = useState<string>("");

  const isSFASProgram = program?.title?.toLowerCase().includes('sfas');

  useEffect(() => {
    if (open && isSFASProgram) {
      fetchMaxLifts();
    }
  }, [open, isSFASProgram]);

  const fetchMaxLifts = async () => {
    setLoadingLifts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('bench_3rm, squat_3rm, deadlift_3rm')
        .eq('id', user.id)
        .single();

      if (profile) {
        setMaxLifts({
          bench_3rm: profile.bench_3rm,
          squat_3rm: profile.squat_3rm,
          deadlift_3rm: profile.deadlift_3rm
        });
        setBench3rm(profile.bench_3rm?.toString() || "");
        setSquat3rm(profile.squat_3rm?.toString() || "");
        setDeadlift3rm(profile.deadlift_3rm?.toString() || "");
        
        // Show inputs if any are missing
        if (!profile.bench_3rm || !profile.squat_3rm || !profile.deadlift_3rm) {
          setShowLiftInputs(true);
        }
      } else {
        setShowLiftInputs(true);
      }
    } catch (error) {
      console.error("Error fetching max lifts:", error);
    } finally {
      setLoadingLifts(false);
    }
  };

  const saveMaxLifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          bench_3rm: bench3rm ? parseInt(bench3rm) : null,
          squat_3rm: squat3rm ? parseInt(squat3rm) : null,
          deadlift_3rm: deadlift3rm ? parseInt(deadlift3rm) : null
        })
        .eq('id', user.id);

      if (error) throw error;

      setMaxLifts({
        bench_3rm: bench3rm ? parseInt(bench3rm) : null,
        squat_3rm: squat3rm ? parseInt(squat3rm) : null,
        deadlift_3rm: deadlift3rm ? parseInt(deadlift3rm) : null
      });
      setShowLiftInputs(false);
      toast.success("Max lifts saved!");
    } catch (error) {
      console.error("Error saving max lifts:", error);
      toast.error("Failed to save max lifts");
    }
  };

  if (!program) return null;

  const endDate = addDays(startDate, program.durationWeeks * 7);
  const hasAllMaxLifts = maxLifts.bench_3rm && maxLifts.squat_3rm && maxLifts.deadlift_3rm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start {program.title}</DialogTitle>
          <DialogDescription>
            This {program.durationWeeks}-week program includes {program.daysPerWeek} training days per week.
            Choose your start date below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 3RM Section for SFAS Program */}
          {isSFASProgram && (
            <div className="space-y-3">
              {loadingLifts ? (
                <div className="text-sm text-muted-foreground">Loading your max lifts...</div>
              ) : showLiftInputs ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Enter Your 3RM Values</p>
                      <p className="text-xs text-muted-foreground">
                        The SFAS program uses percentage-based weights. Enter your 3-rep max for each lift.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Bench (lbs)</label>
                      <Input
                        type="number"
                        value={bench3rm}
                        onChange={(e) => setBench3rm(e.target.value)}
                        placeholder="200"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Squat (lbs)</label>
                      <Input
                        type="number"
                        value={squat3rm}
                        onChange={(e) => setSquat3rm(e.target.value)}
                        placeholder="295"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Deadlift (lbs)</label>
                      <Input
                        type="number"
                        value={deadlift3rm}
                        onChange={(e) => setDeadlift3rm(e.target.value)}
                        placeholder="335"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={saveMaxLifts} className="w-full">
                    Save Max Lifts
                  </Button>
                </div>
              ) : hasAllMaxLifts ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Max Lifts Set</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Bench:</span>
                      <span className="font-medium ml-1">{maxLifts.bench_3rm} lbs</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Squat:</span>
                      <span className="font-medium ml-1">{maxLifts.squat_3rm} lbs</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deadlift:</span>
                      <span className="font-medium ml-1">{maxLifts.deadlift_3rm} lbs</span>
                    </div>
                  </div>
                  <button 
                    className="text-xs text-muted-foreground hover:text-foreground mt-2"
                    onClick={() => setShowLiftInputs(true)}
                  >
                    Edit values
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Program Start</span>
              <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Program End</span>
              <span className="font-medium">{format(endDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Workouts</span>
              <span className="font-medium">{program.durationWeeks * program.daysPerWeek}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(program.id, startDate)}
            disabled={isLoading || (isSFASProgram && showLiftInputs)}
          >
            {isLoading ? "Generating Schedule..." : "Start Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartProgramModal;
