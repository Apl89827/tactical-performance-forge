import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layouts/MobileLayout";
import ProgramCard from "@/components/programs/ProgramCard";
import StartProgramModal from "@/components/programs/StartProgramModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Dumbbell } from "lucide-react";

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
  const [activeProgram, setActiveProgram] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchActiveProgram();
  }, []);

  const fetchPrograms = async () => {
    try {
      // Fetch programs that are public or assigned to user
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

      // Get exercise counts for each program
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

  const fetchActiveProgram = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("active_program_id")
        .eq("id", user.id)
        .single();

      if (data?.active_program_id) {
        setActiveProgram(data.active_program_id);
      }
    } catch (error) {
      console.error("Error fetching active program:", error);
    }
  };

  const handleSelectProgram = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    if (program) {
      setSelectedProgram(program);
      setModalOpen(true);
    }
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

      // Update profile with active program
      await supabase
        .from("profiles")
        .update({
          active_program_id: programId,
          program_start_date: startDate.toISOString().split("T")[0],
        })
        .eq("id", user.id);

      toast.success("Program started! Your calendar is ready.");
      setModalOpen(false);
      navigate("/calendar");
    } catch (error) {
      console.error("Error starting program:", error);
      toast.error("Failed to start program. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
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
          <h1 className="text-xl font-bold mb-2">Choose Your Program</h1>
          <p className="text-muted-foreground text-sm">
            Select a training program to load your 12-week schedule. Workouts will be
            automatically added to your calendar.
          </p>
        </div>

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
                isSelected={activeProgram === program.id}
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
