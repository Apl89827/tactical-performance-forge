import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, Activity, Calendar, Target, Dumbbell } from "lucide-react";

interface UserPerformance {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  total_workouts_completed: number;
  total_training_days: number;
  last_workout_date: string | null;
  total_volume_lbs: number | null;
  avg_rpe: number | null;
  latest_pushups: number | null;
  latest_situps: number | null;
  latest_pullups: number | null;
  latest_run_time: string | null;
  bench_5rm: number | null;
  squat_5rm: number | null;
  deadlift_5rm: number | null;
  bodyweight: number | null;
  selection_date: string | null;
}

export const AnalyticsDashboard = () => {
  const [userData, setUserData] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [selectedUser]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Call the security definer function to get performance data
      const { data, error } = await supabase.rpc("get_user_performance", {
        target_user_id: selectedUser === "all" ? null : selectedUser
      });

      if (error) throw error;
      setUserData(data || []);
    } catch (error) {
      console.error("Error loading performance data:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const refreshMaterializedView = async () => {
    try {
      setRefreshing(true);
      const { error } = await supabase.rpc("refresh_performance_summary");
      
      if (error) throw error;
      toast.success("Analytics refreshed");
      await loadPerformanceData();
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      toast.error("Failed to refresh analytics");
    } finally {
      setRefreshing(false);
    }
  };

  const calculateDaysToSelection = (selectionDate: string | null) => {
    if (!selectionDate) return null;
    const today = new Date();
    const selection = new Date(selectionDate);
    const diffTime = selection.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const aggregateStats = userData.reduce(
    (acc, user) => ({
      totalWorkouts: acc.totalWorkouts + (user.total_workouts_completed || 0),
      totalVolume: acc.totalVolume + (user.total_volume_lbs || 0),
      activeUsers: user.total_workouts_completed > 0 ? acc.activeUsers + 1 : acc.activeUsers,
      avgRpe: acc.avgRpe + (user.avg_rpe || 0),
    }),
    { totalWorkouts: 0, totalVolume: 0, activeUsers: 0, avgRpe: 0 }
  );

  const avgRpe = userData.length > 0 ? (aggregateStats.avgRpe / userData.length).toFixed(1) : 0;

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Performance metrics and user insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {userData.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={refreshMaterializedView}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              Across {aggregateStats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(aggregateStats.totalVolume / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Pounds lifted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg RPE</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRpe}</div>
            <p className="text-xs text-muted-foreground">Intensity level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Training regularly</p>
          </CardContent>
        </Card>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {userData.map((user) => {
          const daysToSelection = calculateDaysToSelection(user.selection_date);
          
          return (
            <Card key={user.user_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {user.first_name} {user.last_name}
                  </span>
                  {daysToSelection !== null && (
                    <Badge variant={daysToSelection < 30 ? "destructive" : "secondary"}>
                      {daysToSelection} days to selection
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {user.total_workouts_completed} workouts • {user.total_training_days} training days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">5RM Strength</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bench</p>
                      <p className="font-semibold">{user.bench_5rm || "—"} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Squat</p>
                      <p className="font-semibold">{user.squat_5rm || "—"} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadlift</p>
                      <p className="font-semibold">{user.deadlift_5rm || "—"} lbs</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Latest PT Scores</h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Push</p>
                      <p className="font-semibold">{user.latest_pushups || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sit</p>
                      <p className="font-semibold">{user.latest_situps || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pull</p>
                      <p className="font-semibold">{user.latest_pullups || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Run</p>
                      <p className="font-semibold text-xs">{user.latest_run_time || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Volume</p>
                    <p className="font-semibold">
                      {user.total_volume_lbs ? `${(user.total_volume_lbs / 1000).toFixed(1)}K lbs` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg RPE</p>
                    <p className="font-semibold">{user.avg_rpe?.toFixed(1) || "—"}</p>
                  </div>
                </div>

                {user.last_workout_date && (
                  <p className="text-xs text-muted-foreground">
                    Last workout: {new Date(user.last_workout_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userData.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No performance data available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
};