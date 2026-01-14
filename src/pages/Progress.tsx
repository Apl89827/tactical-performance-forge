import React, { useState } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { Activity, Target, TrendingUp } from "lucide-react";
import { useProgressData } from "@/hooks/useProgressData";
import ProgressChart from "@/components/progress/ProgressChart";
import StatCard from "@/components/progress/StatCard";

const Progress = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { ptMetrics, workoutStats, loading } = useProgressData();
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pt-scores", label: "PT Scores" },
    { id: "strength", label: "Strength" },
  ];

  const formatTime = (time: number) => {
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChange = (data: any[], key: string, lowerIsBetter = false) => {
    if (data.length < 2) return 0;
    const first = data[0][key];
    const last = data[data.length - 1][key];
    if (!first || !last) return 0;
    return lowerIsBetter 
      ? ((first - last) / first * 100)
      : ((last - first) / first * 100);
  };

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
              left: `${(tabs.findIndex(t => t.id === activeTab) / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`
            }}
          />
        </div>
        
        {activeTab === "overview" && (
          <div className="space-y-6">
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
                  style={{ width: `${(workoutStats.currentWeek / workoutStats.totalWeeks) * 100}%` }}
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

            {/* Recent Highlights */}
            {ptMetrics.length > 0 && (
              <StatCard
                title="1.5 Mile Run"
                value={ptMetrics[ptMetrics.length - 1]?.runTime ? formatTime(ptMetrics[ptMetrics.length - 1].runTime!) : "--"}
                change={getChange(ptMetrics.filter(m => m.runTime), 'runTime', true)}
                lowerIsBetter
              >
                <ProgressChart 
                  data={ptMetrics.filter(m => m.runTime)} 
                  dataKey="runTime"
                  color="hsl(var(--accent))"
                  lowerIsBetter
                  formatValue={formatTime}
                />
              </StatCard>
            )}
          </div>
        )}
        
        {activeTab === "pt-scores" && (
          <div className="space-y-4">
            {ptMetrics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No PT metrics recorded yet.</p>
                <p className="text-sm mt-1">Add your scores in your profile.</p>
              </div>
            ) : (
              <>
                <StatCard
                  title="1.5 Mile Run"
                  value={ptMetrics[ptMetrics.length - 1]?.runTime ? formatTime(ptMetrics[ptMetrics.length - 1].runTime!) : "--"}
                  change={getChange(ptMetrics.filter(m => m.runTime), 'runTime', true)}
                  lowerIsBetter
                >
                  <ProgressChart data={ptMetrics.filter(m => m.runTime)} dataKey="runTime" color="hsl(var(--accent))" lowerIsBetter formatValue={formatTime} />
                </StatCard>

                <StatCard
                  title="Push-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.pushups || "--"}
                  change={getChange(ptMetrics.filter(m => m.pushups), 'pushups')}
                >
                  <ProgressChart data={ptMetrics.filter(m => m.pushups)} dataKey="pushups" />
                </StatCard>

                <StatCard
                  title="Sit-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.situps || "--"}
                  change={getChange(ptMetrics.filter(m => m.situps), 'situps')}
                >
                  <ProgressChart data={ptMetrics.filter(m => m.situps)} dataKey="situps" />
                </StatCard>

                <StatCard
                  title="Pull-ups"
                  value={ptMetrics[ptMetrics.length - 1]?.pullups || "--"}
                  change={getChange(ptMetrics.filter(m => m.pullups), 'pullups')}
                >
                  <ProgressChart data={ptMetrics.filter(m => m.pullups)} dataKey="pullups" />
                </StatCard>
              </>
            )}
          </div>
        )}
        
        {activeTab === "strength" && (
          <div className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Strength tracking coming soon!</p>
              <p className="text-sm mt-1">Your lift history will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Progress;
