import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveProgram {
  id: string;
  programId: string;
  title: string;
  programType: string;
  startDate: string;
  endDate: string | null;
  currentWeek: number;
  totalWeeks: number;
  completedWorkouts: number;
  totalWorkouts: number;
  daysPerWeek: number;
}

const MAX_ACTIVE_PROGRAMS = 2;

export function useActivePrograms() {
  const [activePrograms, setActivePrograms] = useState<ActiveProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePrograms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActivePrograms([]);
        setLoading(false);
        return;
      }

      // Fetch user's program assignments with program details
      const { data: assignments, error: assignError } = await supabase
        .from("user_program_assignments")
        .select(`
          id,
          program_id,
          start_date,
          end_date,
          workout_programs!inner (
            id,
            title,
            duration_weeks,
            days_per_week,
            program_type
          )
        `)
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setActivePrograms([]);
        setLoading(false);
        return;
      }

      // Filter to only active assignments (not ended)
      const today = new Date().toISOString().split("T")[0];
      const activeAssignments = assignments.filter(a => {
        if (!a.end_date) return true;
        return a.end_date >= today;
      }).slice(0, MAX_ACTIVE_PROGRAMS);

      // Get workout stats for each program
      const programsWithStats = await Promise.all(
        activeAssignments.map(async (assignment) => {
          const program = assignment.workout_programs as any;
          
          // Get workout completion stats
          const { data: workouts } = await supabase
            .from("user_scheduled_workouts")
            .select("id, status, week_number")
            .eq("user_id", user.id)
            .eq("program_id", assignment.program_id);

          const completed = workouts?.filter(w => w.status === "completed").length || 0;
          const total = workouts?.length || program.duration_weeks * program.days_per_week;

          // Calculate current week
          let currentWeek = 1;
          if (assignment.start_date) {
            const startDate = new Date(assignment.start_date);
            const todayDate = new Date();
            const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            currentWeek = Math.min(Math.max(1, Math.ceil((daysDiff + 1) / 7)), program.duration_weeks);
          }

          return {
            id: assignment.id,
            programId: assignment.program_id,
            title: program.title,
            programType: program.program_type || "strength",
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            currentWeek,
            totalWeeks: program.duration_weeks,
            completedWorkouts: completed,
            totalWorkouts: total,
            daysPerWeek: program.days_per_week,
          };
        })
      );

      setActivePrograms(programsWithStats);
    } catch (err: any) {
      console.error("Error fetching active programs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canAddProgram = () => {
    return activePrograms.length < MAX_ACTIVE_PROGRAMS;
  };

  const isProgamActive = (programId: string) => {
    return activePrograms.some(p => p.programId === programId);
  };

  const removeProgram = async (programId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete the assignment
      await supabase
        .from("user_program_assignments")
        .delete()
        .eq("user_id", user.id)
        .eq("program_id", programId);

      // Also clean up scheduled workouts
      await supabase
        .from("user_scheduled_workouts")
        .delete()
        .eq("user_id", user.id)
        .eq("program_id", programId);

      // Refresh the list
      await fetchActivePrograms();
      return true;
    } catch (err: any) {
      console.error("Error removing program:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchActivePrograms();
  }, []);

  return {
    activePrograms,
    loading,
    error,
    canAddProgram,
    isProgamActive,
    removeProgram,
    refetch: fetchActivePrograms,
    MAX_ACTIVE_PROGRAMS,
  };
}
