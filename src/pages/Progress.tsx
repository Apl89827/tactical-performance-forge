import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Activity, Target, TrendingUp, Dumbbell, Plus, Flag } from "lucide-react";
import { useProgressData } from "@/hooks/useProgressData";
import ProgressChart from "@/components/progress/ProgressChart";
import StatCard from "@/components/progress/StatCard";
import PTScoreForm from "@/components/profile/PTScoreForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SELECTION_TARGETS } from "@/lib/selectionTargets";

const Progress = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPTForm, setShowPTForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { ptMetrics, strengthMetrics, workoutStats, profileProgress, loading, refetch } =
    useProgressData();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pt-scores", label: "PT Scores" },
    { id: "strength", label: "Strength" },
  ];

  React.useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getChange = (data: any[], key: string, lowerIsBetter = false) => {
    if (data.length < 2) return 0;
    const first = data[0][key];
    const last = data[data.length - 1][key];
    if (!first || !last) return 0;
    return lowerIsBetter
      ? ((first - last) / first) * 100
      : ((last - first) / first) * 100;
  };

  const handlePTFormComplete = async () => {
    await refetch();
    setShowPTForm(false);
  };

  // Resolve selection targets for this user
  const isSelectionCandidate = profileProgress.focusType === "Selection Candidate";
  const selectionKey = profileProgress.selectionType ?? "";
  const targets = isSelectionCandidate ? SELECTION_TARGETS[selectionKey] ?? null : null;

  // Selection date countdown
  const daysToSelection = (() => {
    if (!profileProgress.selectionDate) return null;
    const diff = new Date(profileProgress.selectionDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 py-3 text-sm font-medium relative transition-colors ${
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

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Selection countdown banner */}
            {isSelectionCandidate && daysToSelection !== null && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                <Flag size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {targets?.label ?? profileProgress.selectionType} selection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {daysToSelection > 0
                      ? `${daysToSelection} days out — keep pushing`
                      : daysToSelection === 0
                      ? "Selection day — execute"
                      : "Selection date passed"}
                  </p>
                </div>
              </div>
            )}

            {/* Program Progress */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Program Progress</h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  Week {workoutStats.currentWeek}/{workoutStats.totalWeeks}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all"
                  style={{
                    width: `${(workoutStats.currentWeek / workoutStats.totalWeeks) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round((workoutStats.currentWeek / workoutStats.totalWeeks) * 100)}% complete
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-primary" />
                  <span className="text-sm font-medium">Workouts</span>
                </div>
                <div className="text-3xl font-bold">{workoutStats.totalCompleted}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={18} className="text-accent" />
                  <span className="text-sm font-medium">Adherence</span>
                </div>
                <div className="text-3xl font-bold">{workoutStats.adherence}%</div>
                <p className="text-xs text-muted-foreground">Consistency</p>
              </div>
            </div>

            {/* Recent Highlights — run time with target if applicable */}
            {ptMetrics.length > 0 && (
              <StatCard
                title="1.5 Mile Run"
                value={
                  ptMetrics[ptMetrics.length - 1]?.runTime
                    ? formatTime(ptMetrics[ptMetrics.length - 1].runTime!)
                    : "--"
                }
                change={getChange(ptMetrics.filter((m) => m.runTime), "runTime", true)}
                lowerIsBetter
              >
                <ProgressChart
                  data={ptMetrics.filter((m) => m.runTime)}
                  dataKey="runTime"
                  color="hsl(var(--accent))"
                  lowerIsBetter
                  formatValue={formatTime}
                  targetValue={targets?.runTime}
                  targetLabel={targets ? `${targets.label} goal` : undefined}
                />
              </StatCard>
            )}
          </div>
        )}

        {/* ── PT SCORES TAB ── */}
        {activeTab === "pt-scores" && (
          <div className="space-y-4">
            {/* Target scores banner for selection candidates */}
            {isSelectionCandidate && targets && (
              <div className="bg-card rounded-xl border border-amber-500/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flag size={14} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {targets.label} targets
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {targets.runTime && (
                    <div>
                      <p className="text-xs font-medium">{formatTime(targets.runTime)}</p>
                      <p className="text-[10px] text-muted-foreground">Run</p>
                    </div>
                  )}
                  {targets.pushups && (
                    <div>
                      <p className="text-xs font-medium">{targets.pushups}</p>
                      <p className="text-[10px] text-muted-foreground">Push-ups</p>
                    </div>
                  )}
                  {targets.situps && (
                    <div>
                      <p className="text-xs font-medium">{targets.situps}</p>
                      <p className="text-[10px] text-muted-foreground">Sit-ups</p>
                    </div>
                  )}
                  {targets.pullups && (
                    <div>
                      <p className="text-xs font-medium">{targets.pullups}</p>
                      <p className="text-[10px] text-muted-foreground">Pull-ups</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Dashed amber line on each chart = selection target
                </p>
              </div>
            )}

            {/* Add New PT Test Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowPTForm(true)} size="sm" className="gap-2">
                <Plus size={16} />
                Log PT Test
              </Button>
            </div>

            {/* PT Form Modal */}
            {showPTForm && userId && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-lg font-semibold mb-4">Record PT Test Results</h2>
                  <PTScoreForm
                    userId={userId}
                    initialValues={{}}
                    onComplete={handlePTFormComplete}
                  />
                </div>
              </div>
            )}

            {ptMetrics.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <TrendingUp size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No PT metrics recorded yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Record your first PT test to start tracking progress
                </p>
                <Button onClick={() => setShowPTForm(true)}>Record PT Test</Button>
              </div>
            ) : (
              <>
                <StatCard
                  title="1.5 Mile Run"
                  value={
                    ptMetrics[ptMetrics.length - 1]?.runTime
                      ? formatTime(ptMetrics[ptMetrics.length - 1].runTime!)
                      : "--"
                  }
                  change={getChange(ptMetrics.filter((m) => m.runTime), "runTime", true)}
                  lowerIsBetter
                >
                  <ProgressChart
                    data={ptMetrics.filter((m) => m.runTime)}
                    dataKey="runTime"
                    color="hsl(var(--accent))"
                    lowerIsBetter
                    formatValue={formatTime}
                    targetValue={targets?.runTime}
                    targetLabel={targets ? `${targets.label} goal` : undefined}
                  />
                </StatCard>

                <StatCard
                  title="Push-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.pushups || "--"}
                  change={getChange(ptMetrics.filter((m) => m.pushups), "pushups")}
                >
                  <ProgressChart
                    data={ptMetrics.filter((m) => m.pushups)}
                    dataKey="pushups"
                    targetValue={targets?.pushups}
                    targetLabel={targets ? `${targets.label} goal` : undefined}
                  />
                </StatCard>

                <StatCard
                  title="Sit-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.situps || "--"}
                  change={getChange(ptMetrics.filter((m) => m.situps), "situps")}
                >
                  <ProgressChart
                    data={ptMetrics.filter((m) => m.situps)}
                    dataKey="situps"
                    targetValue={targets?.situps}
                    targetLabel={targets ? `${targets.label} goal` : undefined}
                  />
                </StatCard>

                <StatCard
                  title="Pull-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.pullups || "--"}
                  change={getChange(ptMetrics.filter((m) => m.pullups), "pullups")}
                >
                  <ProgressChart
                    data={ptMetrics.filter((m) => m.pullups)}
                    dataKey="pullups"
                    targetValue={targets?.pullups}
                    targetLabel={targets ? `${targets.label} goal` : undefined}
                  />
                </StatCard>
              </>
            )}
          </div>
        )}

        {/* ── STRENGTH TAB ── */}
        {activeTab === "strength" && (
          <div className="space-y-4">
            {Object.keys(strengthMetrics).length > 0 ? (
              <>
                {Object.entries(strengthMetrics).map(([exercise, data]) => (
                  <StatCard
                    key={exercise}
                    title={exercise}
                    icon={<Dumbbell size={18} className="text-primary" />}
                    value={data.length > 0 ? `${data[data.length - 1].weight} lbs` : "--"}
                  >
                    {data.length > 1 ? (
                      <ProgressChart
                        data={data.map((d) => ({ date: d.date, value: d.weight }))}
                        dataKey="value"
                        formatValue={(v) => `${v} lbs`}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Complete more workouts to see progression
                      </div>
                    )}
                  </StatCard>
                ))}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold mb-2">How Strength is Tracked</h3>
                  <p className="text-sm text-muted-foreground">
                    Your strength metrics are pulled from your profile's 5RM values. As you log
                    workouts and update your maxes, your progression will appear here.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No Strength Data Yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your 5RM values from your profile will appear here. Update your profile to add
                  your current maxes.
                </p>
                <Button variant="outline" onClick={() => navigate("/profile")}>
                  Update Profile
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Progress;
