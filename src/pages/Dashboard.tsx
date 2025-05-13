
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Play, Clock, Calendar as CalendarIcon, BarChart2 } from "lucide-react";
import CountdownTile from "../components/home/CountdownTile";
import EditableStats from "../components/home/EditableStats";
import EditableWorkout from "../components/home/EditableWorkout";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState({
    phase: "Strength",
    week: "2 of 8",
    workouts: "7 Done"
  });
  
  // Mock data for today's workout
  const [todaysWorkout, setTodaysWorkout] = useState({
    id: "today",
    title: "Lower Body Strength",
    description: "Focus on squat patterns and posterior chain",
    exercises: [
      { name: "Back Squat", sets: 5, reps: "5" },
      { name: "Romanian Deadlift", sets: 4, reps: "8" },
      { name: "Walking Lunges", sets: 3, reps: "12 each" },
      { name: "Weighted Step-ups", sets: 3, reps: "10 each" },
    ],
    duration: 60,
  });
  
  // Mock data for upcoming workouts
  const upcomingWorkouts = [
    {
      id: "tomorrow",
      date: new Date(Date.now() + 86400000),
      title: "Upper Body Push",
      type: "Strength",
    },
    {
      id: "day-after",
      date: new Date(Date.now() + 172800000),
      title: "Conditioning",
      type: "Work Capacity",
    },
  ];
  
  useEffect(() => {
    async function getUserData() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }
        
        // Get profile data from localStorage or API
        const storedData = localStorage.getItem("profileData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        
        if (parsedData) {
          setProfileData(parsedData);
        }
        
        // Check if user is admin
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
          
        setIsAdmin(roles && roles.length > 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getUserData();
  }, [navigate]);
  
  // Format date as "Day, Month Date"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Update stats handler
  const handleStatsUpdate = (newStats: {phase: string, week: string, workouts: string}) => {
    setStats(newStats);
  };
  
  // Update workout handler
  const handleWorkoutUpdate = (updatedWorkout: any) => {
    setTodaysWorkout(updatedWorkout);
  };

  if (loading) {
    return (
      <MobileLayout hideBackButton={true}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideBackButton={true}>
      <div className="mobile-safe-area py-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src="/lovable-uploads/cb57105b-33dc-4813-9b66-ba828e6b1d42.png" 
              alt="Performance First Logo" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        {/* Header with greeting */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold">
            Good morning, {profileData?.first_name || "Athlete"}
          </h1>
          <p className="text-muted-foreground">Let's crush today's workout</p>
        </header>
        
        {/* Selection Countdown Tile - Only visible if selection data exists */}
        <CountdownTile 
          selectionDate={profileData?.selectionDate || null} 
          selectionType={profileData?.selectionType || null} 
        />
        
        {/* Quick stats - Now editable for admins */}
        <EditableStats
          phase={stats.phase}
          week={stats.week}
          workouts={stats.workouts}
          isAdmin={isAdmin}
          onStatsUpdated={handleStatsUpdate}
        />
        
        {/* Today's workout - Now editable for admins */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Today's Workout</h2>
          <EditableWorkout
            workout={todaysWorkout}
            isAdmin={isAdmin}
            onWorkoutUpdated={handleWorkoutUpdate}
          />
        </section>
        
        {/* Upcoming workouts */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Coming Up</h2>
            <button 
              className="text-tactical-blue flex items-center text-sm"
              onClick={() => navigate("/calendar")}
            >
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center bg-card rounded-lg p-3 border border-border">
                <div className="bg-secondary/60 rounded p-2 mr-3">
                  <CalendarIcon size={20} className="text-tactical-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{workout.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(workout.date)}</p>
                </div>
                <div className="bg-secondary/30 py-1 px-2 rounded text-xs">
                  {workout.type}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Progress overview */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Progress</h2>
            <button 
              className="text-tactical-blue flex items-center text-sm"
              onClick={() => navigate("/progress")}
            >
              See Details
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">PT Score Progress</h3>
              <div className="bg-tactical-blue/20 text-tactical-blue text-xs py-1 px-2 rounded">
                Improving
              </div>
            </div>
            
            <div className="h-32 flex items-center justify-center bg-muted/20 rounded mb-4">
              <BarChart2 size={32} className="text-muted-foreground" />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Run (1.5 mi)</p>
                <p className="font-medium">10:45 → 10:20</p>
              </div>
              <div>
                <p className="text-muted-foreground">Push-ups</p>
                <p className="font-medium">52 → 58</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
