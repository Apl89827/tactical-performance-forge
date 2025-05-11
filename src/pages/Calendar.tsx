
import React, { useState } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Generate mock workout schedule for the month
  const getMonthWorkouts = () => {
    const workouts: Record<string, any> = {};
    
    // Current month's dates
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Workout types
    const workoutTypes = [
      { title: "Upper Body Push", type: "Strength" },
      { title: "Lower Body", type: "Strength" },
      { title: "Conditioning", type: "Work Capacity" },
      { title: "Upper Body Pull", type: "Strength" },
      { title: "Active Recovery", type: "Recovery" },
      { title: "Ruck March", type: "Endurance" },
      { title: "PT Test Prep", type: "Conditioning" },
    ];
    
    // Create a schedule with rest days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Skip some days as rest days (e.g., every 4th day)
      if (day % 4 !== 0) {
        const workoutIndex = (day % workoutTypes.length);
        workouts[day] = {
          id: `workout-${month}-${day}`,
          date,
          ...workoutTypes[workoutIndex],
        };
      }
    }
    
    return workouts;
  };
  
  const monthWorkouts = getMonthWorkouts();
  
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
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        currentMonth: true,
        today: new Date(year, month, i).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0),
        date: new Date(year, month, i),
        workout: monthWorkouts[i],
      });
    }
    
    // Next month's days to fill out the last row
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }
    
    return days;
  };
  
  const handleDateSelect = (date: Date, workout?: any) => {
    setSelectedDate(date);
    if (workout) {
      navigate(`/workout/${workout.id}`);
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
                onClick={() => handleDateSelect(day.date, day.workout)}
                className={`
                  aspect-square p-1 flex flex-col items-center rounded
                  ${day.currentMonth ? "" : "opacity-30"} 
                  ${day.today ? "border border-tactical-blue" : ""} 
                  ${day.workout ? "cursor-pointer" : ""}
                  ${
                    day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0) 
                    ? "bg-secondary/60" : ""
                  }
                `}
              >
                <span className={`
                  text-center w-6 h-6 flex items-center justify-center rounded-full
                  ${day.today ? "bg-tactical-blue text-white" : ""}
                `}>
                  {day.day}
                </span>
                
                {/* Workout indicator */}
                {day.workout && (
                  <div 
                    className={`
                      w-full h-1 mt-1 rounded-full 
                      ${
                        day.workout.type === "Strength" ? "bg-tactical-blue" : 
                        day.workout.type === "Work Capacity" ? "bg-tactical-orange" : 
                        day.workout.type === "Endurance" ? "bg-green-600" : 
                        day.workout.type === "Recovery" ? "bg-purple-500" :
                        "bg-gray-500"
                      }
                    `}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected date workouts */}
        <div>
          <h3 className="font-semibold mb-3">{formatWorkoutDate(selectedDate)}</h3>
          
          {calendarDays.find(
            day => day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
          )?.workout ? (
            <div className="bg-card rounded-lg border border-border p-4">
              {(() => {
                const day = calendarDays.find(
                  day => day.date.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0)
                );
                const workout = day?.workout;
                
                return (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{workout?.title}</h3>
                      <div className={`
                        px-2 py-1 rounded text-xs
                        ${
                          workout?.type === "Strength" ? "bg-tactical-blue/20 text-tactical-blue" : 
                          workout?.type === "Work Capacity" ? "bg-tactical-orange/20 text-tactical-orange" : 
                          workout?.type === "Endurance" ? "bg-green-600/20 text-green-600" : 
                          workout?.type === "Recovery" ? "bg-purple-500/20 text-purple-500" :
                          "bg-gray-500/20 text-gray-500"
                        }
                      `}>
                        {workout?.type}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">
                      This workout focuses on {workout?.title.toLowerCase()} development with progressive overload.
                    </p>
                    
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/workout/${workout?.id}`)}
                    >
                      Start Workout
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-muted-foreground">
                Rest day. Focus on recovery, mobility, and proper nutrition.
              </p>
            </div>
          )}
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
