import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Play, Clock, Calendar as CalendarIcon, BarChart2, Layers, ChevronRight } from "lucide-react";
import CountdownTile from "../components/home/CountdownTile";
import EditableStats from "../components/home/EditableStats";
import EditableWorkout from "../components/home/EditableWorkout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Active program state
  const [activeProgram, setActiveProgram] = useState<{
    id: string;
    title: string;
    currentWeek: number;
    totalWeeks: number;
    completedWorkouts: number;
    totalWorkouts: number;
  } | null>(null);
  
  // Real stats from program data
  const [programStats, setProgramStats] = useState({
    phase: "-",
    week: "-",
    workoutsRemaining: "-"
  });
  
  // Today's workout
  const [todaysWorkout, setTodaysWorkout] = useState<{
    id: string;
    title: string;
    description: string;
    exercises: { name: string; sets: number; reps: string }[];
    duration: number;
    status?: string;
  } | null>(null);
  
  // Scheduled upcoming workouts
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<any[]>([]);
  
  useEffect(() => {
    async function getUserData() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }
        
        // Get profile data including active program
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, active_program_id, program_start_date, first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfileData(profile);
          
          // Fetch active program details
          if (profile.active_program_id) {
            const { data: program } = await supabase
              .from('workout_programs')
              .select('id, title, duration_weeks, days_per_week')
              .eq('id', profile.active_program_id)
              .single();
            
            if (program) {
              // Get workout completion stats
              const { data: workouts } = await supabase
                .from('user_scheduled_workouts')
                .select('id, status, week_number, date')
                .eq('user_id', user.id)
                .eq('program_id', program.id)
                .order('date', { ascending: true });
              
              const completed = workouts?.filter(w => w.status === 'completed').length || 0;
              const total = workouts?.length || program.duration_weeks * program.days_per_week;
              const remaining = total - completed;
              
              // Calculate current week based on program start date
              let currentWeekNum = 1;
              if (profile.program_start_date) {
                const startDate = new Date(profile.program_start_date);
                const today = new Date();
                const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                currentWeekNum = Math.min(Math.max(1, Math.ceil((daysDiff + 1) / 7)), program.duration_weeks);
              }
              
              // Calculate phase (4 weeks per phase for SFAS-style programs)
              const weeksPerPhase = 4;
              const currentPhase = Math.ceil(currentWeekNum / weeksPerPhase);
              const phaseNames = ["Foundation", "Build", "Peak"];
              const phaseName = phaseNames[currentPhase - 1] || `Phase ${currentPhase}`;
              
              setActiveProgram({
                id: program.id,
                title: program.title,
                currentWeek: currentWeekNum,
                totalWeeks: program.duration_weeks,
                completedWorkouts: completed,
                totalWorkouts: total,
              });
              
              // Set real program stats
              setProgramStats({
                phase: phaseName,
                week: `${currentWeekNum} of ${program.duration_weeks}`,
                workoutsRemaining: `${remaining} Left`
              });
            }
          }
        }
        
        // Check if user is admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        setIsAdmin(roles && roles.length > 0);

        // Fetch today's scheduled workout and upcoming 7 days
        const toISODate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        const today = new Date();
        const todayISO = toISODate(today);
        const endISO = toISODate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

        const { data: todays } = await supabase
          .from('user_scheduled_workouts')
          .select('id, date, title, day_type, exercises, status')
          .eq('user_id', user.id)
          .eq('date', todayISO)
          .limit(1);

        if (todays && todays.length > 0) {
          const t = todays[0];
          setTodaysWorkout({
            id: t.id,
            title: t.title,
            description: t.day_type || 'Training Session',
            exercises: Array.isArray(t.exercises) ? t.exercises.map((e: any) => ({
              name: e.name,
              sets: e.sets,
              reps: e.reps
            })) : [],
            duration: 60,
            status: t.status,
          });
        } else {
          setTodaysWorkout(null);
        }

        const { data: upcoming } = await supabase
          .from('user_scheduled_workouts')
          .select('id, date, title, day_type, status')
          .eq('user_id', user.id)
          .gt('date', todayISO)
          .lte('date', endISO)
          .order('date', { ascending: true });

        if (upcoming) {
          setUpcomingWorkouts(
            upcoming.map((w: any) => ({
              id: w.id,
              date: new Date(w.date),
              title: w.title,
              type: w.day_type || 'Training',
            }))
          );

          // Stats are now calculated from active program, not upcoming workouts
        }
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
    setProgramStats({
      phase: newStats.phase,
      week: newStats.week,
      workoutsRemaining: newStats.workouts
    });
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
        
        {/* Active Program Banner */}
        {activeProgram ? (
          <section className="mb-6">
            <div className="bg-gradient-to-r from-tactical-blue/20 to-tactical-blue/5 rounded-lg border border-tactical-blue/30 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-tactical-blue font-medium uppercase tracking-wide">Current Program</p>
                  <h3 className="font-semibold text-lg">{activeProgram.title}</h3>
                </div>
                <span className="bg-tactical-blue/20 text-tactical-blue text-xs py-1 px-2 rounded">
                  Week {activeProgram.currentWeek} of {activeProgram.totalWeeks}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tactical-blue rounded-full transition-all"
                    style={{ width: `${(activeProgram.completedWorkouts / activeProgram.totalWorkouts) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeProgram.completedWorkouts}/{activeProgram.totalWorkouts}
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium mb-1">No Active Program</p>
              <p className="text-sm text-muted-foreground mb-3">Select a training program to get started</p>
              <Button onClick={() => navigate("/programs")} className="w-full">
                Browse Programs
              </Button>
            </div>
          </section>
        )}
        
        {/* Selection Countdown Tile - Only visible if selection data exists */}
        <CountdownTile 
          selectionDate={profileData?.selectionDate || null} 
          selectionType={profileData?.selectionType || null} 
        />
        
        {/* Quick stats - Shows real program data */}
        <EditableStats
          phase={programStats.phase}
          week={programStats.week}
          workouts={programStats.workoutsRemaining}
          derivedStats={{ phase: programStats.phase, week: programStats.week, workouts: programStats.workoutsRemaining }}
          isAdmin={isAdmin}
          onStatsUpdated={handleStatsUpdate}
        />
        
        {/* Today's workout - Now editable for admins */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Today's Workout</h2>
          {todaysWorkout ? (
            <EditableWorkout
              workout={todaysWorkout}
              isAdmin={isAdmin}
              onWorkoutUpdated={handleWorkoutUpdate}
            />
          ) : (
            <div className="workout-card text-center py-8">
              <Play size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No Workout Scheduled</p>
              <p className="text-sm text-muted-foreground mb-4">Start a program to add workouts to your calendar</p>
              <Button onClick={() => navigate("/programs")} variant="outline">
                Browse Programs
              </Button>
            </div>
          )}
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
