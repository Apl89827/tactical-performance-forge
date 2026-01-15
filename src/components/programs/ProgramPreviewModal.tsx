import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Calendar, Dumbbell, Clock, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Exercise {
  id: string;
  movement_name: string;
  sets: number;
  reps: number;
  week_number: number;
  day_of_week: number;
  distance: number | null;
  distance_unit: string | null;
  target_time: string | null;
  notes: string | null;
}

interface ProgramPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
  programTitle: string;
  programDescription: string | null;
  durationWeeks: number;
  daysPerWeek: number;
  programType: string;
  onSelectProgram: () => void;
  isActive: boolean;
  canAdd: boolean;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ProgramPreviewModal: React.FC<ProgramPreviewModalProps> = ({
  open,
  onOpenChange,
  programId,
  programTitle,
  programDescription,
  durationWeeks,
  daysPerWeek,
  programType,
  onSelectProgram,
  isActive,
  canAdd,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && programId) {
      fetchProgramExercises();
    }
  }, [open, programId]);

  const fetchProgramExercises = async () => {
    if (!programId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("id, movement_name, sets, reps, week_number, day_of_week, distance, distance_unit, target_time, notes")
        .eq("program_id", programId)
        .order("week_number", { ascending: true })
        .order("day_of_week", { ascending: true })
        .order("order_position", { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error fetching program exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group exercises by week and day
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const weekKey = exercise.week_number;
    const dayKey = exercise.day_of_week;

    if (!acc[weekKey]) {
      acc[weekKey] = {};
    }
    if (!acc[weekKey][dayKey]) {
      acc[weekKey][dayKey] = [];
    }
    acc[weekKey][dayKey].push(exercise);
    return acc;
  }, {} as Record<number, Record<number, Exercise[]>>);

  const weeks = Object.keys(groupedExercises).map(Number).sort((a, b) => a - b);

  const typeColors: Record<string, string> = {
    strength: "bg-tactical-blue/20 text-tactical-blue",
    endurance: "bg-green-600/20 text-green-600",
    hybrid: "bg-purple-500/20 text-purple-500",
    conditioning: "bg-tactical-orange/20 text-tactical-orange",
  };

  const formatExercise = (exercise: Exercise) => {
    if (exercise.distance && exercise.distance_unit) {
      return `${exercise.distance} ${exercise.distance_unit}`;
    }
    if (exercise.target_time) {
      return `${exercise.sets} × ${exercise.target_time}`;
    }
    return `${exercise.sets} × ${exercise.reps}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{programTitle}</SheetTitle>
              {programDescription && (
                <SheetDescription className="mt-1">
                  {programDescription}
                </SheetDescription>
              )}
            </div>
            <span className={`px-2 py-1 rounded text-xs capitalize ${typeColors[programType] || typeColors.strength}`}>
              {programType}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{durationWeeks} weeks</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{daysPerWeek} days/week</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell size={14} />
              <span>{exercises.length} exercises</span>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-180px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-tactical-blue" />
            </div>
          ) : weeks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No exercises configured for this program yet.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {weeks.map((week) => (
                <AccordionItem key={week} value={`week-${week}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Week {week}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Object.keys(groupedExercises[week]).length} training days)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3">
                      {Object.keys(groupedExercises[week])
                        .map(Number)
                        .sort((a, b) => a - b)
                        .map((day) => (
                          <div key={day} className="bg-muted/50 rounded-lg p-3">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <ChevronRight size={14} className="text-tactical-blue" />
                              {DAY_NAMES[day - 1] || `Day ${day}`}
                            </h4>
                            <ul className="space-y-1.5">
                              {groupedExercises[week][day].map((exercise) => (
                                <li
                                  key={exercise.id}
                                  className="flex items-center justify-between text-sm pl-5"
                                >
                                  <span className="text-foreground">{exercise.movement_name}</span>
                                  <span className="text-muted-foreground font-mono text-xs">
                                    {formatExercise(exercise)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            onClick={() => {
              onSelectProgram();
              onOpenChange(false);
            }}
            variant={isActive ? "secondary" : "default"}
            className="w-full"
            disabled={isActive || (!canAdd && !isActive)}
          >
            {isActive ? "Currently Active" : canAdd ? "Select Program" : "Stack Full"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProgramPreviewModal;
