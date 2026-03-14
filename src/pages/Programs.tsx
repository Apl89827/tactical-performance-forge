import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layouts/MobileLayout";
import StartProgramModal from "@/components/programs/StartProgramModal";
import ProgramPreviewModal from "@/components/programs/ProgramPreviewModal";
import RecommendedProgramCard from "@/components/programs/RecommendedProgramCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Dumbbell, AlertCircle, Target, Trash2, AlertTriangle } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useProgramRecommendations } from "@/hooks/useProgramRecommendations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Program {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  days_per_week: number;
  program_type: string;
  exercise_count: number;
}

// Color config per program type
const TYPE_CONFIG: Record<string, { border: string; badge: string; label: string }> = {
  strength:      { border: "border-l-tactical-blue",   badge: "bg-tactical-blue/15 text-tactical-blue",   label: "Strength" },
  endurance:     { border: "border-l-green-600",        badge: "bg-green-600/15 text-green-600",            label: "Endurance" },
  conditioning:  { border: "border-l-tactical-orange",  badge: "bg-tactical-orange/15 text-tactical-orange",label: "Work Capacity" },
  selection_prep:{ border: "border-l-amber-500",        badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Selection Prep" },
  recovery:      { border: "border-l-purple-500",       badge: "bg-purple-500/15 text-purple-500",          label: "Recovery" },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type?.toLowerCase()] ?? { border: "border-l-border", badge: "bg-secondary text-muted-foreground", label: type };

// Inline ProgramCard with color-coded left border
const ProgramCard = ({
  id, title, description, durationWeeks, daysPerWeek, programType, exerciseCount,
  onSelect, onPreview, isActive, canAdd,
}: {
  id: string; title: string; description: string | null;
  durationWeeks: number; daysPerWeek: number; programType: string;
  exerciseCount: number; onSelect: (id: string) => void; onPreview: (id: string) => void;
  isActive: boolean; canAdd: boolean;
}) => {
  const cfg = getTypeConfig(programType);
  return (
    <div className={`bg-card rounded-xl border border-border border-l-4 ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base leading-tight flex-1 pr-2">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{cfg.label}</span>
        </div>
        {description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span>{durationWeeks}wk</span>
          <span>·</span>
          <span>{daysPerWeek}d/wk</span>
          {exerciseCount > 0 && <><span>·</span><span>{exerciseCount} exercises</span></>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(id)}
            className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Preview
          </button>
          {isActive ? (
            <div className="flex-1 py-2 text-sm text-center rounded-lg bg-primary/10 text-primary font-medium">
              Active
            </div>
          ) : (
            <button
              onClick={() => canAdd && onSelect(id)}
              disabled={!canAdd}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                canAdd
                  ? "bg-tactical-blue text-white hover:bg-tactical-blue/90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
            >
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [programToRemove, setProgramToRemove] = useState<{ id: string; title: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { activePrograms, loading: activeProgramsLoading, canAddProgram, isProgamActive, removeProgram, refetch: refetchActivePrograms, MAX_ACTIVE_PROGRAMS } = useActivePrograms();
  const { recommendations, loading: recommendationsLoading } = useProgramRecommendations();

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try {
      const { data: programsData, error } = await supabase
        .from("workout_programs")
        .select("id, title, description, duration_weeks, days_per_week, program_type")
        .eq("is_public", true);
      if (error) throw error;

      const programIds = programsData?.map((p) => p.id) || [];
      const { data: exerciseCounts } = await supabase
        .from("workout_exercises").select("program_id").in("program_id", programIds);

      const countMap: Record<string, number> = {};
      exerciseCounts?.forEach((e) => { countMap[e.program_id] = (countMap[e.program_id] || 0) + 1; });

      setPrograms((programsData || []).map((p) => ({ ...p, exercise_count: countMap[p.id] || 0 })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const resolveProgram = (programId: string): Program | undefined => {
    let p = programs.find((pr) => pr.id === programId);
    if (!p) {
      const rec = recommendations.find((r) => r.programId === programId);
      if (rec) p = { id: rec.programId, title: rec.programTitle, description: rec.programDescription, duration_weeks: rec.durationWeeks, days_per_week: rec.daysPerWeek, program_type: rec.programType, exercise_count: 0 };
    }
    return p;
  };

  const handlePreviewProgram = (programId: string) => {
    const p = resolveProgram(programId);
    if (!p) return;
    setPreviewProgram(p);
    setPreviewModalOpen(true);
  };

  const handleSelectProgram = (programId: string) => {
    if (isProgamActive(programId)) { toast.info("This program is already active"); return; }
    if (!canAddProgram()) { toast.error(`Max ${MAX_ACTIVE_PROGRAMS} active programs. Remove one to add another.`); return; }
    const p = resolveProgram(programId);
    if (!p) return;
    setSelectedProgram(p);
    setModalOpen(true);
  };

  const handleConfirmProgram = async (programId: string, startDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("generate-program-schedule", {
        body: { userId: user.id, programId, startDate: startDate.toISOString().split("T")[0] },
      });
      if (error) throw error;
      await refetchActivePrograms();
      toast.success("Program added! Your calendar has been updated.");
      setModalOpen(false);
      navigate("/calendar");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start program. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveProgram = async () => {
    if (!programToRemove) return;
    setIsRemoving(true);
    try {
      await removeProgram(programToRemove.id);
      toast.success(`"${programToRemove.title}" removed`);
      setProgramToRemove(null);
    } catch (error) {
      toast.error("Failed to remove program");
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading || activeProgramsLoading || recommendationsLoading) {
    return (
      <MobileLayout title="Programs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-tactical-blue" />
        </div>
      </MobileLayout>
    );
  }

  const recommendedProgramIds = new Set(recommendations.map((r) => r.programId));
  const regularPrograms = programs.filter((p) => !recommendedProgramIds.has(p.id));

  return (
    <MobileLayout title="Programs">
      <div className="mobile-safe-area py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-1">Choose Your Programs</h1>
          <p className="text-muted-foreground text-sm">Stack up to {MAX_ACTIVE_PROGRAMS} programs. Workouts appear on your calendar.</p>
        </div>

        {/* Active Programs */}
        {activePrograms.length > 0 && (
          <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-tactical-blue">Active ({activePrograms.length}/{MAX_ACTIVE_PROGRAMS})</p>
            {activePrograms.map((program) => {
              const cfg = getTypeConfig(program.programType);
              return (
                <div key={program.id} className={`p-4 bg-tactical-blue/10 rounded-xl border border-tactical-blue/30 border-l-4 ${cfg.border}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{program.title}</span>
                        <span className="text-xs bg-tactical-blue/20 text-tactical-blue px-2 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Week {program.currentWeek}/{program.totalWeeks} · {program.completedWorkouts} done</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-tactical-blue rounded-full" style={{ width: `${(program.completedWorkouts / program.totalWorkouts) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((program.completedWorkouts / program.totalWorkouts) * 100)}%</span>
                      </div>
                    </div>
                    <button onClick={() => setProgramToRemove({ id: program.programId, title: program.title })}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!canAddProgram() && (
          <Alert className="mb-4 border-tactical-orange/50 bg-tactical-orange/10">
            <AlertCircle className="h-4 w-4 text-tactical-orange" />
            <AlertDescription className="text-sm">Max {MAX_ACTIVE_PROGRAMS} active programs reached. Remove one to add another.</AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-lg">Recommended For You</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Based on your PT scores:</p>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <RecommendedProgramCard key={rec.programId} recommendation={rec} onSelect={handleSelectProgram}
                  onPreview={handlePreviewProgram} isActive={isProgamActive(rec.programId)} canAdd={canAddProgram()} />
              ))}
            </div>
          </div>
        )}

        {/* All Programs */}
        {regularPrograms.length === 0 && recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Programs Available</h3>
            <p className="text-muted-foreground text-sm">Programs will appear here once published by your coach.</p>
          </div>
        ) : regularPrograms.length > 0 && (
          <>
            {recommendations.length > 0 && <h2 className="font-semibold text-lg mb-3 mt-6">All Programs</h2>}
            <div className="space-y-4">
              {regularPrograms.map((program) => (
                <ProgramCard key={program.id} id={program.id} title={program.title}
                  description={program.description} durationWeeks={program.duration_weeks}
                  daysPerWeek={program.days_per_week} programType={program.program_type}
                  exerciseCount={program.exercise_count} onSelect={handleSelectProgram}
                  onPreview={handlePreviewProgram} isActive={isProgamActive(program.id)} canAdd={canAddProgram()} />
              ))}
            </div>
          </>
        )}
      </div>

      <ProgramPreviewModal open={previewModalOpen} onOpenChange={setPreviewModalOpen}
        programId={previewProgram?.id || null} programTitle={previewProgram?.title || ""}
        programDescription={previewProgram?.description || null} durationWeeks={previewProgram?.duration_weeks || 0}
        daysPerWeek={previewProgram?.days_per_week || 0} programType={previewProgram?.program_type || "strength"}
        onSelectProgram={() => previewProgram && handleSelectProgram(previewProgram.id)}
        isActive={previewProgram ? isProgamActive(previewProgram.id) : false} canAdd={canAddProgram()} />

      <StartProgramModal open={modalOpen} onOpenChange={setModalOpen}
        program={selectedProgram ? { id: selectedProgram.id, title: selectedProgram.title, durationWeeks: selectedProgram.duration_weeks, daysPerWeek: selectedProgram.days_per_week } : null}
        onConfirm={handleConfirmProgram} isLoading={isGenerating} />

      <AlertDialog open={!!programToRemove} onOpenChange={() => setProgramToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />Remove Program?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>"{programToRemove?.title}"</strong> and delete all associated scheduled workouts.
              <br /><br /><span className="text-destructive font-medium">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveProgram} disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRemoving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing...</> : "Remove Program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default Programs;
