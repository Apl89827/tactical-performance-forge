import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DBProgram = { id: string; title: string; description?: string | null };

interface ProgramImporterProps {
  onImported?: () => void;
}

type RawWorkoutItem = {
  exercise_id?: string;
  order?: number;
  prescribed?: string;
  notes?: string | null;
};

type RawWorkout = {
  workout_id?: string;
  day?: number;
  session_type?: string | null;
  name?: string | null;
  header?: string | null;
  notes?: string | null;
  exercises?: RawWorkoutItem[];
};

type RawProgramShard = {
  program_id?: string;
  name?: string;
  author?: string;
  duration_weeks?: number | null;
  description?: string | null;
  audience?: string[] | null;
  equipment_needed?: string[] | null;
  structure?: string | null;
  week?: number | null;
  workouts?: RawWorkout[];
};

type RawInput = {
  programs?: RawProgramShard[];
} | RawProgramShard;

const ProgramImporter: React.FC<ProgramImporterProps> = ({ onImported }) => {
  const [programs, setPrograms] = useState<DBProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [newProgramTitle, setNewProgramTitle] = useState<string>("");
  const [newProgramDescription, setNewProgramDescription] = useState<string>("");
  const [rawJson, setRawJson] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const { data, error } = await supabase
      .from("workout_programs")
      .select("id, title, description")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading programs", error);
      toast.error("Failed to load programs");
      return;
    }
    setPrograms(data || []);
    if (data && data.length > 0 && !selectedProgramId) {
      setSelectedProgramId(data[0].id);
    }
  };

  const exampleDetectedTitle = useMemo(() => {
    try {
      const parsed: RawInput = JSON.parse(rawJson);
      const shards = Array.isArray((parsed as any).programs)
        ? (parsed as any).programs as RawProgramShard[]
        : [parsed as RawProgramShard];

      // Try to infer a name to prefill "new program" title
      const firstWithName = shards.find(s => s?.name) || shards[0];
      return firstWithName?.name || "";
    } catch {
      return "";
    }
  }, [rawJson]);

  const handleImport = async () => {
    // Admin-only operations will be enforced by RLS.
    setLoading(true);
    console.log("[Importer] Starting import...");

    try {
      if (!rawJson.trim()) {
        toast.error("Please paste the JSON to import.");
        setLoading(false);
        return;
      }

      let targetProgramId = selectedProgramId;
      const parsed: RawInput = JSON.parse(rawJson);

      // If creating a new program, insert it first
      if (mode === "new") {
        const titleToUse = newProgramTitle.trim() || exampleDetectedTitle || "Imported Program";
        const { data: created, error: createErr } = await supabase
          .from("workout_programs")
          .insert({
            title: titleToUse,
            description: newProgramDescription || null,
          })
          .select()
          .single();

        if (createErr) {
          console.error("[Importer] Error creating program", createErr);
          toast.error("Failed to create new program (are you an admin?)");
          setLoading(false);
          return;
        }
        targetProgramId = created?.id;
        console.log("[Importer] Created program", created);
      } else {
        if (!targetProgramId) {
          toast.error("Please select a program to import into.");
          setLoading(false);
          return;
        }
      }

      // Normalize input to an array of "shards", each with workouts
      const shards: RawProgramShard[] = Array.isArray((parsed as any)?.programs)
        ? ((parsed as any).programs as RawProgramShard[])
        : [parsed as RawProgramShard];

      // Flatten workouts across shards
      const allWorkouts: RawWorkout[] = shards.flatMap(s => s.workouts || []);
      if (allWorkouts.length === 0) {
        toast.error("No workouts found in the provided JSON.");
        setLoading(false);
        return;
      }

      let importedCount = 0;

      // Process each workout sequentially to keep things simple
      for (const w of allWorkouts) {
        const day = typeof w.day === "number" && !Number.isNaN(w.day) ? w.day : importedCount + 1;
        const workoutPayload = {
          program_id: targetProgramId,
          day,
          name: w.name || w.header || `Day ${day}`,
          header: w.header || null,
          session_type: w.session_type || null,
          notes: w.notes || null,
          external_id: w.workout_id || null,
        };

        // Upsert workout per unique (program_id, day)
        const { data: upsertedWorkout, error: upsertErr } = await supabase
          .from("program_workouts")
          .upsert(workoutPayload, { onConflict: "program_id,day" })
          .select()
          .single();

        if (upsertErr || !upsertedWorkout) {
          console.error("[Importer] Workout upsert failed", upsertErr);
          toast.error(`Failed to save workout for day ${day}`);
          setLoading(false);
          return;
        }

        const workoutId = upsertedWorkout.id as string;

        // Clear any existing items to keep ordering consistent
        const { error: delErr } = await supabase
          .from("program_workout_items")
          .delete()
          .eq("workout_id", workoutId);

        if (delErr) {
          console.error("[Importer] Failed to clear old items", delErr);
          toast.error("Failed to clear previous workout items");
          setLoading(false);
          return;
        }

        const items = (w.exercises || []).map((ex, idx) => {
          const order_position = typeof ex.order === "number" && !Number.isNaN(ex.order)
            ? ex.order
            : idx + 1;

          return {
            workout_id: workoutId,
            order_position,
            exercise_code: ex.exercise_id || null,
            // Do NOT set external_id due to duplicates in provided JSON ("ex_" appears multiple times)
            movement_name: null,
            prescribed: ex.prescribed || null,
            notes: ex.notes || null,
            is_bodyweight_percentage: false,
            bodyweight_percentage: null,
          };
        });

        if (items.length > 0) {
          const { error: itemsErr } = await supabase
            .from("program_workout_items")
            .insert(items);

          if (itemsErr) {
            console.error("[Importer] Items insert failed", itemsErr);
            toast.error(`Failed to save items for day ${day}`);
            setLoading(false);
            return;
          }
        }

        importedCount += 1;
      }

      toast.success(`Imported ${importedCount} workout${importedCount === 1 ? "" : "s"} successfully`);
      console.log("[Importer] Import complete");

      // Refresh local programs list (useful if a new program was created)
      await loadPrograms();

      if (onImported) onImported();
    } catch (e: any) {
      console.error("[Importer] Error", e);
      toast.error(e?.message || "Invalid JSON or import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Target Program</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            onClick={() => setMode("existing")}
            className="h-9"
          >
            Existing
          </Button>
          <Button
            type="button"
            variant={mode === "new" ? "default" : "outline"}
            onClick={() => setMode("new")}
            className="h-9"
          >
            New
          </Button>
        </div>
      </div>

      {mode === "existing" ? (
        <div>
          <Label htmlFor="program-select">Select Program</Label>
          <select
            id="program-select"
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          >
            {programs.length === 0 && <option value="">No programs found</option>}
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <Label htmlFor="new-program-title">New Program Title</Label>
            <Input
              id="new-program-title"
              value={newProgramTitle}
              placeholder={exampleDetectedTitle || "e.g., Hypertrophy 2.0"}
              onChange={(e) => setNewProgramTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-program-description">Description (optional)</Label>
            <Textarea
              id="new-program-description"
              value={newProgramDescription}
              onChange={(e) => setNewProgramDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="json">Paste JSON</Label>
        <Textarea
          id="json"
          placeholder='Paste the "programs" JSON here'
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className="mt-1 min-h-[220px] font-mono text-xs"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleImport} disabled={loading}>
          {loading ? "Importing..." : "Import"}
        </Button>
      </div>
    </div>
  );
};

export default ProgramImporter;
