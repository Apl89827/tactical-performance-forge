
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "../components/layouts/MobileLayout";
import WorkoutTimer from "../components/workout/WorkoutTimer";
import ExerciseCard from "../components/workout/ExerciseCard";
import { Clock, CheckCircle } from "lucide-react";

interface ScheduledExercise {
  movement_name: string;
  sets: number;
  reps: number;
  notes?: string | null;
  order_position: number;
  is_bodyweight_percentage?: boolean;
  bodyweight_percentage?: number | null;
}

interface UserMaxLifts {
  weight: number | null;
  bench_3rm: number | null;
  deadlift_3rm: number | null;
  squat_3rm: number | null;
  bench_5rm: number | null;
  deadlift_5rm: number | null;
  squat_5rm: number | null;
}

interface ExerciseSetState {
  setNumber: number;
  targetReps: string | number;
  weight: number | null;
  completedReps: string | number | null;
  isCompleted: boolean;
}

const toISODate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

const Workout = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [userMaxLifts, setUserMaxLifts] = useState<UserMaxLifts | null>(null);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<{
    id: string;
    title: string;
    day_type: string | null;
    exercises: ScheduledExercise[];
    date: string;
  } | null>(null);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isRestTimer, setIsRestTimer] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  // Local sets state and index of existing set log rows
  const [setsState, setSetsState] = useState<Record<string, ExerciseSetState>>({});
  const [setRowIndex, setSetRowIndex] = useState<Record<string, string>>({});

  // Derived workout object for UI
  const workoutTitle = scheduled?.title || "Workout";
  const workoutDescription = scheduled?.day_type || "Training Session";
  const exercisesForUI = useMemo(() => {
    if (!scheduled) return [] as Array<{
      id: number;
      name: string;
      sets: ExerciseSetState[];
      notes: string;
      restTime: number;
      video: string;
      isBodyweightPercentage?: boolean;
      bodyweightPercentage?: number;
      userMaxLifts?: UserMaxLifts | null;
    }>;

    return scheduled.exercises
      .sort((a, b) => a.order_position - b.order_position)
      .map((ex, idx) => {
        const baseSets: ExerciseSetState[] = Array.from({ length: ex.sets }).map((_, i) => {
          const key = `${idx}-${i + 1}`;
          return (
            setsState[key] || {
              setNumber: i + 1,
              targetReps: ex.reps,
              weight: null,
              completedReps: null,
              isCompleted: false,
            }
          );
        });

        return {
          id: idx + 1,
          name: ex.movement_name,
          sets: baseSets,
          notes: ex.notes || "",
          restTime: 90,
          video: "",
          isBodyweightPercentage: !!ex.is_bodyweight_percentage,
          bodyweightPercentage: ex.bodyweight_percentage ?? undefined,
          userMaxLifts,
        };
      });
  }, [scheduled, setsState, userMaxLifts]);

  // Load scheduled workout, ensure workout log exists, and hydrate set logs
  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          toast.error("Workout not found");
          navigate("/calendar");
          return;
        }

        // SEO
        document.title = `${scheduled?.title ?? "Workout"} | Performance First`;

        // Ensure user is logged in
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          navigate("/login");
          return;
        }

        // Load profile to get weight and RM values
        const { data: profile } = await supabase
          .from("profiles")
          .select("weight, bench_3rm, deadlift_3rm, squat_3rm, bench_5rm, deadlift_5rm, squat_5rm")
          .eq("id", auth.user.id)
          .maybeSingle();
        
        setUserMaxLifts({
          weight: profile?.weight ?? null,
          bench_3rm: profile?.bench_3rm ?? null,
          deadlift_3rm: profile?.deadlift_3rm ?? null,
          squat_3rm: profile?.squat_3rm ?? null,
          bench_5rm: profile?.bench_5rm ?? null,
          deadlift_5rm: profile?.deadlift_5rm ?? null,
          squat_5rm: profile?.squat_5rm ?? null,
        });

        // Load scheduled workout
        const { data: s, error: sErr } = await (supabase as any)
          .from("user_scheduled_workouts")
          .select("id, date, title, day_type, exercises")
          .eq("id", id)
          .maybeSingle();
        if (sErr) throw sErr;
        if (!s) {
          toast.error("Scheduled workout not found");
          navigate("/calendar");
          return;
        }
        setScheduled(s);

        // Create or fetch workout log
        const { data: existingLog } = await (supabase as any)
          .from("user_workout_logs")
          .select("id, started_at, completed_at")
          .eq("scheduled_workout_id", id)
          .maybeSingle();

        let logId = existingLog?.id as string | undefined;
        if (!logId) {
          const { data: newLog, error: logErr } = await (supabase as any)
            .from("user_workout_logs")
            .insert({ scheduled_workout_id: id })
            .select("id, started_at")
            .single();
          if (logErr) throw logErr;
          logId = newLog.id;
          setStartTime(new Date(newLog.started_at));
        } else {
          setStartTime(existingLog?.started_at ? new Date(existingLog.started_at) : new Date());
          if (existingLog?.completed_at) setWorkoutCompleted(true);
        }
        setWorkoutLogId(logId);

        // Load existing set logs
        const { data: setLogs, error: slErr } = await (supabase as any)
          .from("user_set_logs")
          .select("id, exercise_index, set_number, target_reps, actual_reps, actual_weight, completed")
          .eq("workout_log_id", logId);
        if (slErr) throw slErr;

        const newSetsState: Record<string, ExerciseSetState> = {};
        const newIndex: Record<string, string> = {};
        if (Array.isArray(setLogs)) {
          setLogs.forEach((row: any) => {
            const key = `${row.exercise_index}-${row.set_number}`;
            newIndex[key] = row.id;
            newSetsState[key] = {
              setNumber: row.set_number,
              targetReps: row.target_reps ?? "",
              weight: row.actual_weight ?? null,
              completedReps: row.actual_reps ?? null,
              isCompleted: !!row.completed,
            };
          });
        }
        setSetRowIndex(newIndex);
        setSetsState((prev) => ({ ...prev, ...newSetsState }));

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workout");
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Timers
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (isRestTimer && prev > 0) return prev - 1;
          if (!isRestTimer) return prev + 1;
          if (isRestTimer && prev === 0) {
            setIsTimerRunning(false);
            setIsRestTimer(false);
            toast.success("Rest complete! Continue your workout.");
            return 0;
          }
          return prev;
        });
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isTimerRunning, isRestTimer]);

  // Total time ticker
  useEffect(() => {
    if (startTime && !workoutCompleted) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setTotalTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, workoutCompleted]);

  const toggleTimer = () => setIsTimerRunning((v) => !v);
  const resetTimer = () => {
    if (isRestTimer) setTimer(0);
    else setTimer(0);
    setIsTimerRunning(false);
  };
  const startRestTimer = (seconds: number) => {
    setTimer(seconds);
    setIsRestTimer(true);
    setIsTimerRunning(true);
  };

  const persistSetLog = async (
    exerciseIndex: number,
    setNumber: number,
    updates: Partial<{ completed: boolean; actual_weight: number | null; actual_reps: number | null }>,
    targetReps?: number | string
  ) => {
    if (!workoutLogId) return;
    const key = `${exerciseIndex}-${setNumber}`;
    const existingId = setRowIndex[key];

    try {
      if (existingId) {
        const { error } = await (supabase as any)
          .from("user_set_logs")
          .update({ ...updates })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from("user_set_logs")
          .insert({
            workout_log_id: workoutLogId,
            exercise_index: exerciseIndex,
            set_number: setNumber,
            target_reps: typeof targetReps === "string" ? parseInt(targetReps) || null : targetReps ?? null,
            actual_reps: updates.actual_reps ?? null,
            actual_weight: updates.actual_weight ?? null,
            completed: updates.completed ?? false,
          })
          .select("id")
          .single();
        if (error) throw error;
        setSetRowIndex((prev) => ({ ...prev, [key]: data.id }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save set");
    }
  };

  const updateSetData = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const setNumber = setIndex + 1;
    const key = `${exerciseIndex}-${setNumber}`;

    setSetsState((prev) => ({
      ...prev,
      [key]: {
        setNumber,
        targetReps: prev[key]?.targetReps ?? (scheduled?.exercises[exerciseIndex]?.reps ?? 0),
        weight: field === "weight" ? (value === "" ? null : Number(value)) : prev[key]?.weight ?? null,
        completedReps: field === "completedReps" ? (value === "" ? null : value) : prev[key]?.completedReps ?? null,
        isCompleted: field === "isCompleted" ? !!value : prev[key]?.isCompleted ?? false,
      },
    }));

    // Persist change
    if (field === "weight") {
      persistSetLog(exerciseIndex, setNumber, { actual_weight: value === "" ? null : Number(value) }, setsState[key]?.targetReps as any);
    } else if (field === "completedReps") {
      const repsVal = value === "" ? null : Number(value);
      persistSetLog(exerciseIndex, setNumber, { actual_reps: repsVal }, setsState[key]?.targetReps as any);
    } else if (field === "isCompleted") {
      persistSetLog(exerciseIndex, setNumber, { completed: !!value }, setsState[key]?.targetReps as any);
      // Auto-advance will be handled by UI state below
    }

    // Auto-advance when all sets in exercise complete
    const allSets = exercisesForUI[exerciseIndex]?.sets || [];
    const nextStateSets = allSets.map((s) => (s.setNumber === setNumber ? { ...s, isCompleted: field === "isCompleted" ? !!value : s.isCompleted } : s));
    const allCompleted = nextStateSets.every((s) => s.isCompleted);
    if (allCompleted && exerciseIndex < exercisesForUI.length - 1) {
      setActiveExerciseIndex(exerciseIndex + 1);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      // Compute completion
      let total = 0;
      let done = 0;
      exercisesForUI.forEach((ex) => {
        ex.sets.forEach((s) => {
          total += 1;
          if (s.isCompleted) done += 1;
        });
      });
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      // Persist completion
      if (workoutLogId) {
        const { error: logError } = await (supabase as any)
          .from("user_workout_logs")
          .update({ completed_at: toISODate(new Date()) })
          .eq("id", workoutLogId);
        if (logError) throw logError;

        // Mark scheduled workout as completed
        const { error: scheduleError } = await (supabase as any)
          .from("user_scheduled_workouts")
          .update({ status: 'completed' })
          .eq("id", id);
        if (scheduleError) throw scheduleError;
      }

      setWorkoutCompleted(true);
      toast.success(`Workout completed! ${pct}% of sets completed.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to complete workout");
    }
  };

  const formatTotalTime = () => {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <MobileLayout title="Workout">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!scheduled) {
    return (
      <MobileLayout title="Workout">
        <div className="p-6 text-center text-muted-foreground">Workout not found.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Workout">
      <div className="mobile-safe-area py-4">
        <header className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">{workoutTitle}</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock size={14} className="mr-1" />
              <span>{formatTotalTime()}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{workoutDescription}</p>
        </header>

        <WorkoutTimer
          timer={timer}
          isRunning={isTimerRunning}
          onToggle={toggleTimer}
          onReset={resetTimer}
          isRest={isRestTimer}
        />

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Exercises</h2>
          <div className="space-y-1">
            {exercisesForUI.map((exercise, exerciseIndex) => (
              <ExerciseCard
                key={exercise.id}
                id={exercise.id}
                index={exerciseIndex}
                name={exercise.name}
                sets={exercise.sets}
                notes={exercise.notes}
                restTime={exercise.restTime}
                video={exercise.video}
                isActive={activeExerciseIndex === exerciseIndex}
                isBodyweightPercentage={exercise.isBodyweightPercentage}
                bodyweightPercentage={exercise.bodyweightPercentage}
                userMaxLifts={exercise.userMaxLifts ?? undefined}
                onSetComplete={(exIdx, setIdx, isCompleted) => {
                  updateSetData(exIdx, setIdx, "isCompleted", isCompleted);
                  if (isCompleted) startRestTimer(exercise.restTime);
                }}
                onSetDataChange={updateSetData}
                onRestTimerStart={startRestTimer}
              />
            ))}
          </div>
        </section>

        <div className="pb-6">
          <button
            className={`btn-primary flex items-center justify-center space-x-2 ${
              workoutCompleted ? "bg-green-600" : "bg-gradient-to-r from-tactical-blue to-tactical-blue/80"
            }`}
            onClick={handleCompleteWorkout}
            disabled={workoutCompleted}
          >
            {workoutCompleted ? (
              <>
                <CheckCircle size={18} className="mr-2" />
                <span>Workout Completed!</span>
              </>
            ) : (
              <span>Complete Workout</span>
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Workout;
