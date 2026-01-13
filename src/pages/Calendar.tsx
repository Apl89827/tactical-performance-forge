
import React, { useState, useEffect } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Load scheduled workouts for the current month - now supports multiple per day
  const [monthWorkouts, setMonthWorkouts] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchMonthWorkouts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const toISODate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

      const { data } = await (supabase as any)
        .from('user_scheduled_workouts')
        .select('id, date, title, day_type, status, program_id')
        .eq('user_id', user.id)
        .gte('date', toISODate(monthStart))
        .lte('date', toISODate(monthEnd));

      if (data) {
        const map: Record<number, any[]> = {};
        data.forEach((w: any) => {
          const day = new Date(w.date).getDate();
          const workout = {
            id: w.id,
            date: new Date(w.date),
            title: w.title,
            type: w.day_type || 'Training',
            status: w.status || 'scheduled',
            programId: w.program_id,
          };
          if (!map[day]) {
            map[day] = [];
          }
          map[day].push(workout);
        });
        setMonthWorkouts(map);
      }
    };

    fetchMonthWorkouts();
  }, [currentDate]);
  
  
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Get calendar grid days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month's days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        currentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i),
        workouts: [],
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        currentMonth: true,
        today: new Date(year, month, i).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0),
        date: new Date(year, month, i),
        workouts: monthWorkouts[i] || [],
      });
    }
    
    // Next month's days to fill out the last row
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i),
        workouts: [],
      });
    }
    
    return days;
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };
  
  // Get short label for workout tile
  const getShortLabel = (title: string, type: string) => {
    // Return first word or abbreviation
    const words = title.split(' ');
    if (words[0].length <= 6) return words[0];
    if (type === 'Strength') return 'STR';
    if (type === 'Endurance') return 'END';
    if (type === 'Work Capacity') return 'WC';
    if (type === 'Recovery') return 'REC';
    return words[0].slice(0, 4);
  };
  
  const getWorkoutColor = (type: string, status: string) => {
    if (status === 'completed') return 'bg-green-600';
    switch (type) {
      case 'Strength': return 'bg-tactical-blue';
      case 'Work Capacity': return 'bg-tactical-orange';
      case 'Endurance': return 'bg-green-600';
      case 'Recovery': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  const formatWorkoutDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  
  const calendarDays = getCalendarDays();
  
  return (
    <MobileLayout title="Calendar">
      <div className="mobile-safe-area py-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button 
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Calendar grid */}
        <div className="mb-6">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-medium text-muted-foreground p-1"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDateSelect(day.date)}
                className={`
                  min-h-[56px] p-1 flex flex-col items-center rounded cursor-pointer
                  ${day.currentMonth ? "" : "opacity-30"} 
                  ${day.today ? "border border-tactical-blue" : ""} 
                  ${
                    day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0) 
                    ? "bg-secondary/60" : ""
                  }
                `}
              >
                <span className={`
                  text-center w-5 h-5 text-xs flex items-center justify-center rounded-full
                  ${day.today ? "bg-tactical-blue text-white" : ""}
                `}>
                  {day.day}
                </span>
                
                {/* Workout tiles - show up to 2 */}
                <div className="w-full flex flex-col gap-0.5 mt-0.5">
                  {day.workouts?.slice(0, 2).map((workout: any, wIndex: number) => (
                    <div
                      key={workout.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkoutClick(workout.id);
                      }}
                      className={`
                        w-full px-0.5 py-0.5 rounded text-[8px] text-white font-medium 
                        text-center truncate cursor-pointer hover:opacity-80
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
        
        {/* Selected date workouts */}
        <div>
          <h3 className="font-semibold mb-3">{formatWorkoutDate(selectedDate)}</h3>
          
          {(() => {
            const selectedDay = calendarDays.find(
              day => day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
            );
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
                        <div className={`
                          px-2 py-1 rounded text-xs
                          ${
                            workout.type === "Strength" ? "bg-tactical-blue/20 text-tactical-blue" : 
                            workout.type === "Work Capacity" ? "bg-tactical-orange/20 text-tactical-orange" : 
                            workout.type === "Endurance" ? "bg-green-600/20 text-green-600" : 
                            workout.type === "Recovery" ? "bg-purple-500/20 text-purple-500" :
                            "bg-gray-500/20 text-gray-500"
                          }
                        `}>
                          {workout.type}
                        </div>
                        {workout.status === 'completed' && (
                          <div className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-600">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      className="btn-primary w-full"
                      onClick={() => handleWorkoutClick(workout.id)}
                      disabled={workout.status === 'completed'}
                    >
                      {workout.status === 'completed' ? 'Workout Completed' : 'Start Workout'}
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
          <div className="grid grid-cols-2 gap-2 text-xs">
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
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Calendar;
