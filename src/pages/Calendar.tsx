import React, { useState, useEffect } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PT_MILESTONE_WEEKS_BEFORE, getMilestoneLabel, getMilestoneTargetPct, SELECTION_TARGETS } from "@/lib/selectionTargets";

// Compute milestone dates from a selection date
const getMilestoneDates = (selectionDateStr: string): Array<{ date: Date; label: string; pct: number }> => {
  const selectionDate = new Date(selectionDateStr);
  return PT_MILESTONE_WEEKS_BEFORE.map((weeks) => {
    const milestoneDate = new Date(selectionDate);
    milestoneDate.setDate(milestoneDate.getDate() - weeks * 7);
    return {
      date: milestoneDate,
      label: getMilestoneLabel(weeks),
      pct: getMilestoneTargetPct(weeks),
    };
  });
};

// Build a YYYY-MM-DD key from a Date (local time)
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<Record<number, any[]>>({});

  // Profile for milestone computation
  const [selectionDateStr, setSelectionDateStr] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<string | null>(null);
  const [focusType, setFocusType] = useState<string | null>(null);

  // Derived milestone map: dateKey → milestone info
  const [milestoneMap, setMilestoneMap] = useState<
    Record<string, { label: string; pct: number }>
  >({});

  // Selection date marker
  const [selectionDateKey, setSelectionDateKey] = useState<string | null>(null);

  // Load profile once
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("selection_date, selection_type, focus_type")
        .eq("id", user.id)
        .single();
      if (profile) {
        const sd = (profile as any).selection_date as string | null;
        setSelectionDateStr(sd);
        setSelectionType((profile as any).selection_type ?? null);
        setFocusType((profile as any).focus_type ?? null);

        if (sd) {
          setSelectionDateKey(toDateKey(new Date(sd)));
          const milestones = getMilestoneDates(sd);
          const map: Record<string, { label: string; pct: number }> = {};
          milestones.forEach((m) => {
            map[toDateKey(m.date)] = { label: m.label, pct: m.pct };
          });
          setMilestoneMap(map);
        }
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const fetchMonthWorkouts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const toISODate = (d: Date) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

      const { data } = await (supabase as any)
        .from("user_scheduled_workouts")
        .select("id, date, title, day_type, status, program_id")
        .eq("user_id", user.id)
        .gte("date", toISODate(monthStart))
        .lte("date", toISODate(monthEnd));

      if (data) {
        const map: Record<number, any[]> = {};
        data.forEach((w: any) => {
          const day = new Date(w.date).getDate();
          const workout = {
            id: w.id,
            date: new Date(w.date),
            title: w.title,
            type: w.day_type || "Training",
            status: w.status || "scheduled",
            programId: w.program_id,
          };
          if (!map[day]) map[day] = [];
          map[day].push(workout);
        });
        setMonthWorkouts(map);
      }
    };
    fetchMonthWorkouts();
  }, [currentDate]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ day: daysInPrevMonth - i, currentMonth: false, date: d, workouts: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = toDateKey(d);
      days.push({
        day: i,
        currentMonth: true,
        today: d.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0),
        date: new Date(year, month, i),
        workouts: monthWorkouts[i] || [],
        milestone: milestoneMap[key] ?? null,
        isSelectionDay: key === selectionDateKey,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i), workouts: [] });
    }
    return days;
  };

  const handleDateSelect = (date: Date) => setSelectedDate(date);
  const handleWorkoutClick = (workoutId: string) => navigate(`/workout/${workoutId}`);

  const getShortLabel = (title: string, type: string) => {
    if (type === "Rest") return "REST";
    if (type === "Strength") return "STR";
    if (type === "Endurance") return "END";
    if (type === "Work Capacity") return "WC";
    if (type === "Recovery") return "REC";
    const words = title.split(" ");
    if (words[0].length <= 4) return words[0];
    return words[0].slice(0, 4);
  };

  const getWorkoutColor = (type: string, status: string) => {
    if (status === "completed") return "bg-green-600";
    if (status === "rest" || type === "Rest") return "bg-muted-foreground/40";
    switch (type) {
      case "Strength": return "bg-tactical-blue";
      case "Work Capacity": return "bg-tactical-orange";
      case "Endurance": return "bg-green-600";
      case "Recovery": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const formatWorkoutDate = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const calendarDays = getCalendarDays();
  const isSelectionCandidate = focusType === "Selection Candidate";

  // Find selected day data
  const selectedDay = calendarDays.find(
    (day) => day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
  ) as any;

  const targets =
    isSelectionCandidate && selectionType ? SELECTION_TARGETS[selectionType] ?? null : null;

  return (
    <MobileLayout title="Calendar">
      <div className="mobile-safe-area py-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 rounded-full hover:bg-muted">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-1 rounded-full hover:bg-muted">
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
                const days = Math.ceil(
                  (new Date(selectionDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return days > 0 ? `${days}d out` : days === 0 ? "Today" : "Complete";
              })()}
            </p>
            <span className="ml-auto text-[10px] text-muted-foreground">
              🏁 = PT check &nbsp; ⚑ = selection
            </span>
          </div>
        )}

        {/* Calendar grid */}
        <div className="mb-6">
          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground p-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day: any, index: number) => (
              <div
                key={index}
                onClick={() => handleDateSelect(day.date)}
                className={`
                  min-h-[56px] p-1 flex flex-col items-center rounded cursor-pointer
                  ${day.currentMonth ? "" : "opacity-30"}
                  ${day.today ? "border border-tactical-blue" : ""}
                  ${day.isSelectionDay ? "border border-amber-500 bg-amber-500/10" : ""}
                  ${
                    day.date?.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
                      ? "bg-secondary/60"
                      : ""
                  }
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    text-center w-5 h-5 text-xs flex items-center justify-center rounded-full
                    ${day.today ? "bg-tactical-blue text-white" : ""}
                    ${day.isSelectionDay ? "font-bold" : ""}
                  `}
                >
                  {day.day}
                </span>

                {/* Selection day marker */}
                {day.isSelectionDay && (
                  <span className="text-[9px] text-amber-500 font-medium leading-none mt-0.5">⚑</span>
                )}

                {/* PT milestone marker */}
                {day.milestone && !day.isSelectionDay && (
                  <span
                    className="text-[9px] text-amber-400 leading-none mt-0.5"
                    title={day.milestone.label}
                  >
                    🏁
                  </span>
                )}

                {/* Workout tiles */}
                <div className="w-full flex flex-col gap-0.5 mt-0.5">
                  {day.workouts?.slice(0, 2).map((workout: any) => (
                    <div
                      key={workout.id}
                      onClick={(e) => { e.stopPropagation(); handleWorkoutClick(workout.id); }}
                      className={`
                        w-full px-0.5 py-0.5 rounded text-[8px] text-white font-medium text-center truncate cursor-pointer hover:opacity-80
                        ${getWorkoutColor(workout.type, workout.status)}
                      `}
                      title={workout.title}
                    >
                      {getShortLabel(workout.title, workout.type)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected date detail */}
        <div>
          <h3 className="font-semibold mb-3">{formatWorkoutDate(selectedDate)}</h3>

          {/* PT milestone detail card */}
          {selectedDay?.milestone && isSelectionCandidate && targets && (
            <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🏁</span>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {selectedDay.milestone.label}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Aim for {Math.round(selectedDay.milestone.pct * 100)}% of selection targets today:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {targets.runTime && (
                  <div className="bg-background/50 rounded p-1.5">
                    <p className="text-xs font-medium">
                      {(() => {
                        const t = targets.runTime! * selectedDay.milestone.pct;
                        const m = Math.floor(t);
                        const s = Math.round((t - m) * 60);
                        return `${m}:${String(s).padStart(2, "0")}`;
                      })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Run</p>
                  </div>
                )}
                {targets.pushups && (
                  <div className="bg-background/50 rounded p-1.5">
                    <p className="text-xs font-medium">
                      {Math.round(targets.pushups * selectedDay.milestone.pct)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Push-ups</p>
                  </div>
                )}
                {targets.situps && (
                  <div className="bg-background/50 rounded p-1.5">
                    <p className="text-xs font-medium">
                      {Math.round(targets.situps * selectedDay.milestone.pct)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Sit-ups</p>
                  </div>
                )}
                {targets.pullups && (
                  <div className="bg-background/50 rounded p-1.5">
                    <p className="text-xs font-medium">
                      {Math.round(targets.pullups * selectedDay.milestone.pct)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pull-ups</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selection day card */}
          {selectedDay?.isSelectionDay && (
            <div className="mb-3 bg-amber-500/15 border border-amber-500 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚑</span>
                <div>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    {targets?.label ?? selectionType} — Selection Day
                  </p>
                  <p className="text-xs text-muted-foreground">Execute. Trust the process.</p>
                </div>
              </div>
            </div>
          )}

          {/* Workouts for selected day */}
          {(() => {
            const workouts = selectedDay?.workouts || [];
            if (workouts.length === 0) {
              return (
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-muted-foreground">
                    Rest day. Focus on recovery, mobility, and proper nutrition.
                  </p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {workouts.map((workout: any) => (
                  <div key={workout.id} className="bg-card rounded-lg border border-border p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{workout.title}</h3>
                      <div className="flex gap-2">
                        <div
                          className={`px-2 py-1 rounded text-xs ${
                            workout.type === "Strength"
                              ? "bg-tactical-blue/20 text-tactical-blue"
                              : workout.type === "Work Capacity"
                              ? "bg-tactical-orange/20 text-tactical-orange"
                              : workout.type === "Endurance"
                              ? "bg-green-600/20 text-green-600"
                              : workout.type === "Recovery"
                              ? "bg-purple-500/20 text-purple-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {workout.type}
                        </div>
                        {workout.status === "completed" && (
                          <div className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-600">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn-primary w-full"
                      onClick={() => handleWorkoutClick(workout.id)}
                      disabled={workout.status === "completed"}
                    >
                      {workout.status === "completed" ? "Workout Completed" : "Start Workout"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div className="mt-6 border-t border-border pt-4">
          <h4 className="font-medium text-sm mb-2">Legend</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-tactical-blue mr-2"></div>
              <span>Strength</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-tactical-orange mr-2"></div>
              <span>Work Capacity</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
              <span>Endurance</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <span>Recovery</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40 mr-2"></div>
              <span>Rest Day</span>
            </div>
            {isSelectionCandidate && (
              <div className="flex items-center gap-1">
                <span>🏁</span>
                <span>PT Check</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Calendar;
