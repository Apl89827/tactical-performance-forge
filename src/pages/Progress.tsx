import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Activity, Target, TrendingUp, Dumbbell, Plus, Flag, History } from "lucide-react";
import { useProgressData } from "@/hooks/useProgressData";
import ProgressChart from "@/components/progress/ProgressChart";
import StatCard from "@/components/progress/StatCard";
import PTScoreForm from "@/components/profile/PTScoreForm";
import WorkoutHistoryCard from "@/components/progress/WorkoutHistoryCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SELECTION_TARGETS } from "@/lib/selectionTargets";

// Epley 1RM formula
const epley1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

interface WorkoutHistoryEntry {
  id: string;
  title: string;
  dayType: string | null;
  date: string;
  completedAt: string | null;
  setLogs: any[];
  exerciseNames: string[];
}

const Progress = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPTForm, setShowPTForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [liftHistory, setLiftHistory] = useState<Record<string, { date: string; value: number }[]>>({});

  const { ptMetrics, strengthMetrics, workoutStats, profileProgress, loading, refetch } = useProgressData();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pt-scores", label: "PT Scores" },
    { id: "strength", label: "Strength" },
    { id: "history", label: "History" },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  // Load workout history + compute 1RM history from set logs
  useEffect(() => {
    if (activeTab !== "history" && activeTab !== "strength") return;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: logs } = await (supabase as any)
          .from("user_workout_logs")
          .select("id, started_at, completed_at, scheduled_workout_id")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(30);

        if (!logs || logs.length === 0) { setHistoryLoading(false); return; }

        const logIds = logs.map((l: any) => l.id);
        const { data: setLogs } = await (supabase as any)
          .from("user_set_logs")
          .select("workout_log_id, exercise_index, set_number, actual_weight, actual_reps, completed")
          .in("workout_log_id", logIds);

        const scheduledIds = [...new Set(logs.map((l: any) => l.scheduled_workout_id).filter(Boolean))];
        const { data: scheduled } = await (supabase as any)
          .from("user_scheduled_workouts")
          .select("id, title, day_type, date, exercises")
          .in("id", scheduledIds);

        const scheduledMap: Record<string, any> = {};
        (scheduled || []).forEach((s: any) => { scheduledMap[s.id] = s; });

        const setLogsByWorkout: Record<string, any[]> = {};
        (setLogs || []).forEach((s: any) => {
          if (!setLogsByWorkout[s.workout_log_id]) setLogsByWorkout[s.workout_log_id] = [];
          setLogsByWorkout[s.workout_log_id].push(s);
        });

        // Build workout history entries
        const history: WorkoutHistoryEntry[] = logs
          .filter((l: any) => l.completed_at)
          .map((l: any) => {
            const sw = scheduledMap[l.scheduled_workout_id] || {};
            const exercises = Array.isArray(sw.exercises) ? sw.exercises : [];
            return {
              id: l.id,
              title: sw.title || "Workout",
              dayType: sw.day_type || null,
              date: l.started_at,
              completedAt: l.completed_at,
              setLogs: setLogsByWorkout[l.id] || [],
              exerciseNames: exercises.map((e: any) => e.movement_name || e.name || ""),
            };
          });
        setWorkoutHistory(history);

        // Build 1RM history per exercise from all set logs
        const liftMap: Record<string, { date: string; value: number }[]> = {};
        logs.forEach((log: any) => {
          const sw = scheduledMap[log.scheduled_workout_id];
          if (!sw || !log.completed_at) return;
          const exercises = Array.isArray(sw.exercises) ? sw.exercises : [];
          const sets = setLogsByWorkout[log.id] || [];
          sets.forEach((s: any) => {
            if (!s.actual_weight || !s.actual_reps || !s.completed) return;
            const exName = exercises[s.exercise_index]?.movement_name;
            if (!exName) return;
            const liftType = getLiftType(exName);
            if (!liftType) return;
            const estimated = epley1RM(s.actual_weight, s.actual_reps);
            if (!liftMap[liftType]) liftMap[liftType] = [];
            liftMap[liftType].push({
              date: new Date(log.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              value: estimated,
            });
          });
        });
        // Keep max per date per lift
        const deduped: Record<string, { date: string; value: number }[]> = {};
        Object.entries(liftMap).forEach(([lift, entries]) => {
          const byDate: Record<string, number> = {};
          entries.forEach(({ date, value }) => {
            byDate[date] = Math.max(byDate[date] || 0, value);
          });
          deduped[lift] = Object.entries(byDate).map(([date, value]) => ({ date, value }));
        });
        setLiftHistory(deduped);
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [activeTab]);

  const getLiftType = (name: string): string | null => {
    const l = name.toLowerCase();
    if (l.includes("bench") || (l.includes("press") && !l.includes("leg") && !l.includes("shoulder"))) return "Bench Press";
    if (l.includes("squat")) return "Squat";
    if (l.includes("deadlift") || l.includes(" dl")) return "Deadlift";
    return null;
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time);
    const s = Math.round((time - m) * 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const getChange = (data: any[], key: string, lowerIsBetter = false) => {
    if (data.length < 2) return 0;
    const first = data[0][key], last = data[data.length - 1][key];
    if (!first || !last) return 0;
    return lowerIsBetter ? ((first - last) / first) * 100 : ((last - first) / first) * 100;
  };

  const handlePTFormComplete = async () => { await refetch(); setShowPTForm(false); };

  const isSelectionCandidate = profileProgress.focusType === "Selection Candidate";
  const selectionKey = profileProgress.selectionType ?? "";
  const targets = isSelectionCandidate ? SELECTION_TARGETS[selectionKey] ?? null : null;

  const daysToSelection = (() => {
    if (!profileProgress.selectionDate) return null;
    return Math.ceil((new Date(profileProgress.selectionDate).getTime() - Date.now()) / 86400000);
  })();

  if (loading) {
    return (
      <MobileLayout title="Progress">
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Progress Tracking">
      <div className="mobile-safe-area py-4">
        {/* Tabs */}
        <div className="mb-6 relative">
          <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 py-3 text-sm font-medium relative transition-colors whitespace-nowrap px-2 ${
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
            style={{
              left: `${(tabs.findIndex((t) => t.id === activeTab) / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`,
            }}
          />
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {isSelectionCandidate && daysToSelection !== null && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                <Flag size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {targets?.label ?? profileProgress.selectionType} selection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {daysToSelection > 0 ? `${daysToSelection} days out — keep pushing` : daysToSelection === 0 ? "Selection day — execute" : "Selection date passed"}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Program Progress</h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  Week {workoutStats.currentWeek}/{workoutStats.totalWeeks}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all"
                  style={{ width: `${(workoutStats.currentWeek / workoutStats.totalWeeks) * 100}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round((workoutStats.currentWeek / workoutStats.totalWeeks) * 100)}% complete
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><Activity size={18} className="text-primary" /><span className="text-sm font-medium">Workouts</span></div>
                <div className="text-3xl font-bold">{workoutStats.totalCompleted}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><Target size={18} className="text-accent" /><span className="text-sm font-medium">Adherence</span></div>
                <div className="text-3xl font-bold">{workoutStats.adherence}%</div>
                <p className="text-xs text-muted-foreground">Consistency</p>
              </div>
            </div>

            {ptMetrics.length > 0 && (
              <StatCard
                title="1.5 Mile Run"
                value={ptMetrics[ptMetrics.length - 1]?.runTime ? formatTime(ptMetrics[ptMetrics.length - 1].runTime!) : "--"}
                change={getChange(ptMetrics.filter((m) => m.runTime), "runTime", true)}
                lowerIsBetter
              >
                <ProgressChart data={ptMetrics.filter((m) => m.runTime)} dataKey="runTime" color="hsl(var(--accent))" lowerIsBetter formatValue={formatTime}
                  targetValue={targets?.runTime} targetLabel={targets ? `${targets.label} goal` : undefined} />
              </StatCard>
            )}
          </div>
        )}

        {/* PT SCORES */}
        {activeTab === "pt-scores" && (
          <div className="space-y-4">
            {isSelectionCandidate && targets && (
              <div className="bg-card rounded-xl border border-amber-500/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flag size={14} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{targets.label} targets</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {targets.runTime && <div><p className="text-xs font-medium">{formatTime(targets.runTime)}</p><p className="text-[10px] text-muted-foreground">Run</p></div>}
                  {targets.pushups && <div><p className="text-xs font-medium">{targets.pushups}</p><p className="text-[10px] text-muted-foreground">Push-ups</p></div>}
                  {targets.situps && <div><p className="text-xs font-medium">{targets.situps}</p><p className="text-[10px] text-muted-foreground">Sit-ups</p></div>}
                  {targets.pullups && <div><p className="text-xs font-medium">{targets.pullups}</p><p className="text-[10px] text-muted-foreground">Pull-ups</p></div>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Dashed amber line = selection target</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowPTForm(true)} size="sm" className="gap-2">
                <Plus size={16} />Log PT Test
              </Button>
            </div>

            {showPTForm && userId && (
              <div style={{ position: "relative", zIndex: 50 }}>
                <div style={{ minHeight: "400px", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" }}>
                  <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg">
                    <h2 className="text-lg font-semibold mb-4">Record PT Test Results</h2>
                    <PTScoreForm userId={userId} initialValues={{}} onComplete={handlePTFormComplete} />
                  </div>
                </div>
              </div>
            )}

            {ptMetrics.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <TrendingUp size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No PT metrics recorded yet</p>
                <p className="text-sm text-muted-foreground mb-4">Record your first PT test to start tracking</p>
                <Button onClick={() => setShowPTForm(true)}>Record PT Test</Button>
              </div>
            ) : (
              <>
                {[
                  { title: "1.5 Mile Run", key: "runTime", fmt: formatTime, lower: true, target: targets?.runTime },
                  { title: "Push-ups", key: "pushups", fmt: undefined, lower: false, target: targets?.pushups },
                  { title: "Sit-ups", key: "situps", fmt: undefined, lower: false, target: targets?.situps },
                  { title: "Pull-ups", key: "pullups", fmt: undefined, lower: false, target: targets?.pullups },
                ].map(({ title, key, fmt, lower, target }) => (
                  <StatCard key={key} title={title}
                    value={ptMetrics[ptMetrics.length - 1]?.[key as keyof typeof ptMetrics[0]]
                      ? (fmt ? fmt(ptMetrics[ptMetrics.length - 1][key as keyof typeof ptMetrics[0]] as number) : ptMetrics[ptMetrics.length - 1][key as keyof typeof ptMetrics[0]])
                      : "--"}
                    change={getChange(ptMetrics.filter((m) => m[key as keyof typeof m]), key, lower)}
                    lowerIsBetter={lower}
                  >
                    <ProgressChart data={ptMetrics.filter((m) => m[key as keyof typeof m])} dataKey={key}
                      color={lower ? "hsl(var(--accent))" : undefined}
                      lowerIsBetter={lower} formatValue={fmt}
                      targetValue={target} targetLabel={targets ? `${targets.label} goal` : undefined} />
                  </StatCard>
                ))}
              </>
            )}
          </div>
        )}

        {/* STRENGTH — 1RM from logs */}
        {activeTab === "strength" && (
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : Object.keys(liftHistory).length > 0 ? (
              <>
                {Object.entries(liftHistory).map(([lift, data]) => (
                  <StatCard key={lift} title={`${lift} — est. 1RM`}
                    icon={<Dumbbell size={18} className="text-primary" />}
                    value={data.length > 0 ? `${data[data.length - 1].value} lbs` : "--"}
                    change={getChange(data, "value")}
                  >
                    {data.length > 1 ? (
                      <ProgressChart data={data} dataKey="value" formatValue={(v) => `${v} lbs`} />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-3">Log more workouts to see progression</p>
                    )}
                  </StatCard>
                ))}
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Estimated 1RM calculated from your logged sets using the Epley formula. Updates as you log workouts.</p>
                </div>
              </>
            ) : Object.keys(strengthMetrics).length > 0 ? (
              <>
                {Object.entries(strengthMetrics).map(([exercise, data]) => (
                  <StatCard key={exercise} title={exercise}
                    icon={<Dumbbell size={18} className="text-primary" />}
                    value={data.length > 0 ? `${data[data.length - 1].weight} lbs` : "--"}
                  >
                    <p className="text-sm text-muted-foreground text-center py-3">Profile 5RM — log workouts to track live progression</p>
                  </StatCard>
                ))}
              </>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No Strength Data Yet</p>
                <p className="text-sm text-muted-foreground mb-4">Log workouts with barbell lifts to see 1RM progression here</p>
                <Button variant="outline" onClick={() => navigate("/profile")}>Update Profile</Button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : workoutHistory.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <History size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No completed workouts yet</p>
                <p className="text-sm text-muted-foreground">Complete your first workout to see history here</p>
              </div>
            ) : (
              workoutHistory.map((entry) => (
                <WorkoutHistoryCard key={entry.id} {...entry} />
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Progress;
