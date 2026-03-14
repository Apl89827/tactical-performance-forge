import React, { useState, useEffect } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PT_MILESTONE_WEEKS_BEFORE, getMilestoneLabel, getMilestoneTargetPct, SELECTION_TARGETS } from "@/lib/selectionTargets";

const getMilestoneDates = (selectionDateStr: string) => {
  const selectionDate = new Date(selectionDateStr);
  return PT_MILESTONE_WEEKS_BEFORE.map((weeks) => {
    const d = new Date(selectionDate);
    d.setDate(d.getDate() - weeks * 7);
    return { date: d, label: getMilestoneLabel(weeks), pct: getMilestoneTargetPct(weeks) };
  });
};

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Dot color per workout type
const DOT_COLOR: Record<string, string> = {
  Strength: "bg-tactical-blue",
  "Work Capacity": "bg-tactical-orange",
  Endurance: "bg-green-600",
  Recovery: "bg-purple-500",
  Rest: "bg-muted-foreground/40",
  Training: "bg-tactical-blue",
};

const getDotColor = (type: string, status: string) => {
  if (status === "completed") return "bg-green-500";
  return DOT_COLOR[type] ?? "bg-gray-500";
};

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<Record<number, any[]>>({});
  const [selectionDateStr, setSelectionDateStr] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<string | null>(null);
  const [focusType, setFocusType] = useState<string | null>(null);
  const [milestoneMap, setMilestoneMap] = useState<Record<string, { label: string; pct: number }>>({});
  const [selectionDateKey, setSelectionDateKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("selection_date, selection_type, focus_type")
        .eq("id", user.id).single();
      if (profile) {
        const sd = (profile as any).selection_date as string | null;
        setSelectionDateStr(sd);
        setSelectionType((profile as any).selection_type ?? null);
        setFocusType((profile as any).focus_type ?? null);
        if (sd) {
          setSelectionDateKey(toDateKey(new Date(sd)));
          const map: Record<string, { label: string; pct: number }> = {};
          getMilestoneDates(sd).forEach((m) => { map[toDateKey(m.date)] = { label: m.label, pct: m.pct }; });
          setMilestoneMap(map);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const year = currentDate.getFullYear(), month = currentDate.getMonth();
      const toISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("user_scheduled_workouts").select("id, date, title, day_type, status, program_id")
        .eq("user_id", user.id)
        .gte("date", toISO(new Date(year, month, 1)))
        .lte("date", toISO(new Date(year, month + 1, 0)));
      if (data) {
        const map: Record<number, any[]> = {};
        data.forEach((w: any) => {
          const day = new Date(w.date).getDate();
          if (!map[day]) map[day] = [];
          map[day].push({ id: w.id, date: new Date(w.date), title: w.title, type: w.day_type || "Training", status: w.status || "scheduled", programId: w.program_id });
        });
        setMonthWorkouts(map);
      }
    };
    fetch();
  }, [currentDate]);

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const getCalendarDays = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days: any[] = [];

    for (let i = firstDay - 1; i >= 0; i--)
      days.push({ day: daysInPrev - i, currentMonth: false, date: new Date(year, month - 1, daysInPrev - i), workouts: [] });

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = toDateKey(d);
      days.push({ day: i, currentMonth: true, today: d.setHours(0,0,0,0) === new Date().setHours(0,0,0,0),
        date: new Date(year, month, i), workouts: monthWorkouts[i] || [],
        milestone: milestoneMap[key] ?? null, isSelectionDay: key === selectionDateKey });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++)
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i), workouts: [] });

    return days;
  };

  const isSelectionCandidate = focusType === "Selection Candidate";
  const targets = isSelectionCandidate && selectionType ? SELECTION_TARGETS[selectionType] ?? null : null;
  const calendarDays = getCalendarDays();
  const selectedDay = calendarDays.find((d) => d.date?.setHours(0,0,0,0) === selectedDate.setHours(0,0,0,0)) as any;

  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <MobileLayout title="Calendar">
      <div className="mobile-safe-area py-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-muted">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-muted">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Selection countdown strip */}
        {isSelectionCandidate && selectionDateStr && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Flag size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {targets?.label ?? selectionType} —{" "}
              {(() => {
                const d = Math.ceil((new Date(selectionDateStr).getTime() - Date.now()) / 86400000);
                return d > 0 ? `${d}d out` : d === 0 ? "Today" : "Complete";
              })()}
            </p>
            <span className="ml-auto text-[10px] text-muted-foreground">● = workout &nbsp; ⚑ = selection &nbsp; ✦ = PT check</span>
          </div>
        )}

        {/* Calendar grid */}
        <div className="mb-6">
          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  flex flex-col items-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[52px]
                  ${!day.currentMonth ? "opacity-25" : ""}
                  ${day.today ? "border border-tactical-blue" : ""}
                  ${day.isSelectionDay ? "border border-amber-500 bg-amber-500/8" : ""}
                  ${day.date?.setHours(0,0,0,0) === selectedDate.setHours(0,0,0,0) ? "bg-secondary/60" : "hover:bg-secondary/30"}
                `}
              >
                {/* Day number */}
                <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                  day.today ? "bg-tactical-blue text-white font-medium" : ""
                }`}>
                  {day.day}
                </span>

                {/* Dots row — up to 3 workout dots */}
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  {day.workouts?.slice(0, 3).map((w: any, wi: number) => (
                    <span key={wi} className={`w-1.5 h-1.5 rounded-full ${getDotColor(w.type, w.status)}`} />
                  ))}
                  {day.workouts?.length > 3 && <span className="text-[8px] text-muted-foreground">+{day.workouts.length - 3}</span>}
                </div>

                {/* Milestone / selection markers */}
                {day.isSelectionDay && <span className="text-[9px] text-amber-500 leading-none mt-0.5">⚑</span>}
                {day.milestone && !day.isSelectionDay && <span className="text-[9px] text-amber-400 leading-none mt-0.5">✦</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Selected date detail */}
        <div>
          <h3 className="font-semibold mb-3">{formatDate(selectedDate)}</h3>

          {/* PT milestone detail */}
          {selectedDay?.milestone && isSelectionCandidate && targets && (
            <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">✦</span>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{selectedDay.milestone.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Aim for {Math.round(selectedDay.milestone.pct * 100)}% of selection targets:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {targets.runTime && (
                  <div className="bg-background/50 rounded p-1.5">
                    <p className="text-xs font-medium">{(() => { const t = targets.runTime! * selectedDay.milestone.pct; const m = Math.floor(t); const s = Math.round((t - m) * 60); return `${m}:${String(s).padStart(2, "0")}`; })()}</p>
                    <p className="text-[10px] text-muted-foreground">Run</p>
                  </div>
                )}
                {targets.pushups && <div className="bg-background/50 rounded p-1.5"><p className="text-xs font-medium">{Math.round(targets.pushups * selectedDay.milestone.pct)}</p><p className="text-[10px] text-muted-foreground">Push-ups</p></div>}
                {targets.situps && <div className="bg-background/50 rounded p-1.5"><p className="text-xs font-medium">{Math.round(targets.situps * selectedDay.milestone.pct)}</p><p className="text-[10px] text-muted-foreground">Sit-ups</p></div>}
                {targets.pullups && <div className="bg-background/50 rounded p-1.5"><p className="text-xs font-medium">{Math.round(targets.pullups * selectedDay.milestone.pct)}</p><p className="text-[10px] text-muted-foreground">Pull-ups</p></div>}
              </div>
            </div>
          )}

          {/* Selection day card */}
          {selectedDay?.isSelectionDay && (
            <div className="mb-3 bg-amber-500/15 border border-amber-500 rounded-lg p-4 flex items-center gap-3">
              <span className="text-lg">⚑</span>
              <div>
                <p className="font-semibold text-amber-600 dark:text-amber-400">{targets?.label ?? selectionType} — Selection Day</p>
                <p className="text-xs text-muted-foreground">Execute. Trust the process.</p>
              </div>
            </div>
          )}

          {/* Workouts */}
          {(() => {
            const workouts = selectedDay?.workouts || [];
            if (workouts.length === 0) {
              return (
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-muted-foreground text-sm">Rest day. Focus on recovery and nutrition.</p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {workouts.map((w: any) => (
                  <div key={w.id} className={`bg-card rounded-lg border-l-4 border border-border p-4 ${DOT_COLOR[w.type] ? `border-l-[${DOT_COLOR[w.type]}]` : ""}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">{w.title}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          w.type === "Strength" ? "bg-tactical-blue/20 text-tactical-blue" :
                          w.type === "Work Capacity" ? "bg-tactical-orange/20 text-tactical-orange" :
                          w.type === "Endurance" ? "bg-green-600/20 text-green-600" :
                          w.type === "Recovery" ? "bg-purple-500/20 text-purple-500" : "bg-secondary text-muted-foreground"
                        }`}>{w.type}</span>
                        {w.status === "completed" && <span className="px-2 py-0.5 rounded text-xs bg-green-600/20 text-green-600">✓</span>}
                      </div>
                    </div>
                    <button className="btn-primary w-full" onClick={() => navigate(`/workout/${w.id}`)} disabled={w.status === "completed"}>
                      {w.status === "completed" ? "Completed" : "Start Workout"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div className="mt-6 border-t border-border pt-4">
          <h4 className="font-medium text-sm mb-3">Legend</h4>
          <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-xs">
            {[
              { color: "bg-tactical-blue", label: "Strength" },
              { color: "bg-tactical-orange", label: "Work Capacity" },
              { color: "bg-green-600", label: "Endurance" },
              { color: "bg-green-500", label: "Completed" },
              { color: "bg-purple-500", label: "Recovery" },
              { color: "bg-muted-foreground/40", label: "Rest" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span>{label}</span>
              </div>
            ))}
            {isSelectionCandidate && (
              <>
                <div className="flex items-center gap-1.5"><span className="text-amber-400">✦</span><span>PT Check</span></div>
                <div className="flex items-center gap-1.5"><span className="text-amber-500">⚑</span><span>Selection</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Calendar;
