import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Activity, Target, TrendingUp, Dumbbell, Plus } from "lucide-react";
import { useProgressData } from "@/hooks/useProgressData";
import ProgressChart from "@/components/progress/ProgressChart";
import StatCard from "@/components/progress/StatCard";
import PTScoreForm from "@/components/profile/PTScoreForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Progress = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPTForm, setShowPTForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { ptMetrics, strengthMetrics, workoutStats, loading, refetch } = useProgressData();
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pt-scores", label: "PT Scores" },
    { id: "strength", label: "Strength" },
  ];

  // Get user ID for PT form
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

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

  const handlePTFormComplete = async () => {
    await refetch();
    setShowPTForm(false);
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
            {/* Add New PT Test Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowPTForm(true)}
                size="sm"
                className="gap-2"
              >
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
                <p className="text-sm text-muted-foreground mb-4">Record your first PT test to start tracking progress</p>
                <Button onClick={() => setShowPTForm(true)}>
                  Record PT Test
                </Button>
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
            {Object.keys(strengthMetrics).length > 0 ? (
              <>
                {Object.entries(strengthMetrics).map(([exercise, data]) => (
                  <StatCard
                    key={exercise}
                    title={exercise}
                    icon={<Dumbbell size={18} className="text-primary" />}
                    value={data.length > 0 ? `${data[data.length - 1].weight} lbs` : '--'}
                  >
                    {data.length > 1 ? (
                      <ProgressChart
                        data={data.map(d => ({ date: d.date, value: d.weight }))}
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
                    Your strength metrics are pulled from your profile's 5RM values. 
                    As you log workouts and update your maxes, your progression will appear here.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No Strength Data Yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your 5RM values from your profile will appear here. Update your profile to add your current maxes.
                </p>
                <Button variant="outline" onClick={() => navigate('/profile')}>
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
