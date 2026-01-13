import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layouts/MobileLayout";
import ProgramCard from "@/components/programs/ProgramCard";
import StartProgramModal from "@/components/programs/StartProgramModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Dumbbell, AlertCircle } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Program {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  days_per_week: number;
  program_type: string;
  exercise_count: number;
}

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { 
    activePrograms, 
    loading: activeProgramsLoading, 
    canAddProgram, 
    isProgamActive,
    refetch: refetchActivePrograms,
    MAX_ACTIVE_PROGRAMS 
  } = useActivePrograms();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data: programsData, error } = await supabase
        .from("workout_programs")
        .select(`
          id,
          title,
          description,
          duration_weeks,
          days_per_week,
          program_type
        `)
        .eq("is_public", true);

      if (error) throw error;

      const programIds = programsData?.map((p) => p.id) || [];
      const { data: exerciseCounts } = await supabase
        .from("workout_exercises")
        .select("program_id")
        .in("program_id", programIds);

      const countMap: Record<string, number> = {};
      exerciseCounts?.forEach((e) => {
        countMap[e.program_id] = (countMap[e.program_id] || 0) + 1;
      });

      const programsWithCounts = (programsData || []).map((p) => ({
        ...p,
        exercise_count: countMap[p.id] || 0,
      }));

      setPrograms(programsWithCounts);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProgram = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return;

    // Check if already active
    if (isProgamActive(programId)) {
      toast.info("This program is already active");
      return;
    }

    // Check if can add more programs
    if (!canAddProgram()) {
      toast.error(`You can only have ${MAX_ACTIVE_PROGRAMS} active programs at once. Remove one to add another.`);
      return;
    }

    setSelectedProgram(program);
    setModalOpen(true);
  };

  const handleConfirmProgram = async (programId: string, startDate: Date) => {
    setIsGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call edge function to generate schedule
      const { data, error } = await supabase.functions.invoke("generate-program-schedule", {
        body: {
          userId: user.id,
          programId,
          startDate: startDate.toISOString().split("T")[0],
        },
      });

      if (error) throw error;

      // Refetch active programs to update UI
      await refetchActivePrograms();

      toast.success("Program added! Your calendar has been updated.");
      setModalOpen(false);
      navigate("/calendar");
    } catch (error) {
      console.error("Error starting program:", error);
      toast.error("Failed to start program. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || activeProgramsLoading) {
    return (
      <MobileLayout title="Programs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-tactical-blue" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Programs">
      <div className="mobile-safe-area py-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-2">Choose Your Programs</h1>
          <p className="text-muted-foreground text-sm">
            Stack up to {MAX_ACTIVE_PROGRAMS} programs at once. Workouts from all active programs will appear on your calendar.
          </p>
        </div>

        {/* Active Programs Summary */}
        {activePrograms.length > 0 && (
          <div className="mb-6 p-4 bg-tactical-blue/10 rounded-lg border border-tactical-blue/30">
            <h3 className="font-medium text-sm mb-2 text-tactical-blue">
              Active Programs ({activePrograms.length}/{MAX_ACTIVE_PROGRAMS})
            </h3>
            <div className="space-y-2">
              {activePrograms.map((program) => (
                <div key={program.id} className="flex justify-between items-center text-sm">
                  <span>{program.title}</span>
                  <span className="text-muted-foreground">Week {program.currentWeek}/{program.totalWeeks}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capacity Warning */}
        {!canAddProgram() && (
          <Alert className="mb-4 border-tactical-orange/50 bg-tactical-orange/10">
            <AlertCircle className="h-4 w-4 text-tactical-orange" />
            <AlertDescription className="text-sm">
              You've reached the maximum of {MAX_ACTIVE_PROGRAMS} active programs. Complete or remove one to add another.
            </AlertDescription>
          </Alert>
        )}

        {programs.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Programs Available</h3>
            <p className="text-muted-foreground text-sm">
              Programs will appear here once they're published by your coach.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                id={program.id}
                title={program.title}
                description={program.description}
                durationWeeks={program.duration_weeks}
                daysPerWeek={program.days_per_week}
                programType={program.program_type}
                exerciseCount={program.exercise_count}
                onSelect={handleSelectProgram}
                isActive={isProgamActive(program.id)}
                canAdd={canAddProgram()}
              />
            ))}
          </div>
        )}
      </div>

      <StartProgramModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        program={
          selectedProgram
            ? {
                id: selectedProgram.id,
                title: selectedProgram.title,
                durationWeeks: selectedProgram.duration_weeks,
                daysPerWeek: selectedProgram.days_per_week,
              }
            : null
        }
        onConfirm={handleConfirmProgram}
        isLoading={isGenerating}
      />
    </MobileLayout>
  );
};

export default Programs;
