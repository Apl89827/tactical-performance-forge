import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
interface PTMetric { date: string; runTime?: number; pushups?: number; situps?: number; pullups?: number; }
interface StrengthMetric { date: string; exercise: string; weight: number; }
interface WorkoutStats { totalCompleted: number; totalScheduled: number; adherence: number; currentWeek: number; totalWeeks: number; }
interface ProfileProgress { selectionType: string | null; selectionDate: string | null; focusType: string | null; }
export const useProgressData = () => {
  const [ptMetrics, setPTMetrics] = useState<PTMetric[]>([]);
  const [strengthMetrics, setStrengthMetrics] = useState<Record<string, StrengthMetric[]>>({});
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({ totalCompleted: 0, totalScheduled: 0, adherence: 0, currentWeek: 1, totalWeeks: 8 });
  const [profileProgress, setProfileProgress] = useState<ProfileProgress>({ selectionType: null, selectionDate: null, focusType: null });
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchProgressData(); }, []);
  const fetchProgressData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user; if (!user) return;
      const { data: ptData } = await supabase.from("pt_metrics").select("recorded_at, run_time, pushups, situps, pullups").eq("user_id", user.id).order("recorded_at", { ascending: true });
      if (ptData && ptData.length > 0) setPTMetrics(ptData.map((m) => ({ date: new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), runTime: m.run_time ? parseRunTime(m.run_time) : undefined, pushups: m.pushups ?? undefined, situps: m.situps ?? undefined, pullups: m.pullups ?? undefined })));
      const { data: sw } = await supabase.from("user_scheduled_workouts").select("id, status, week_number").eq("user_id", user.id);
      if (sw) { const completed = sw.filter((w) => w.status === "completed").length; const total = sw.length; const adherence = total > 0 ? Math.round((completed / total) * 100) : 0; const weeks = sw.map((w) => w.week_number ?? 1); const maxWeek = weeks.length > 0 ? Math.max(...weeks) : 1; setWorkoutStats({ totalCompleted: completed, totalScheduled: total, adherence, currentWeek: maxWeek, totalWeeks: 8 }); }
      const { data: profile } = await supabase.from("profiles").select("squat_5rm, bench_5rm, deadlift_5rm, selection_type, selection_date, focus_type").eq("id", user.id).single();
      if (profile) { const sByEx = {} as any; if (profile.squat_5rm) sByEx["Squat"] = [{ date: "Current", exercise: "Squat", weight: profile.squat_5rm }]; if (profile.bench_5rm) sByEx["Bench Press"] = [{ date: "Current", exercise: "Bench Press", weight: profile.bench_5rm }]; if (profile.deadlift_5rm) sByEx["Deadlift"] = [{ date: "Current", exercise: "Deadlift", weight: profile.deadlift_5rm }]; setStrengthMetrics(sByEx); setProfileProgress({ selectionType: (profile as any).selection_type ?? null, selectionDate: (profile as any).selection_date ?? null, focusType: (profile as any).focus_type ?? null }); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  return { ptMetrics, strengthMetrics, workoutStats, profileProgress, loading, refetch: fetchProgressData };
};
const parseRunTime = (t: string): number => { const p = t.split(":"); if (p.length === 2) return parseInt(p[0]) + parseInt(p[1]) / 60; return parseFloat(t) || 0; };
