
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import MobileLayout from "../components/layouts/MobileLayout";
import WorkoutTimer from "../components/workout/WorkoutTimer";
import ExerciseCard from "../components/workout/ExerciseCard";
import { Clock, CheckCircle } from "lucide-react";

const Workout = () => {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isRestTimer, setIsRestTimer] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  
  // Mock workout data
  useEffect(() => {
    const mockWorkout = {
      id: "today",
      title: "Lower Body Strength",
      description: "Focus on squat patterns and posterior chain development",
      warmUp: [
        "5 minutes light cardio",
        "Dynamic stretching",
        "Bodyweight squats 3x10",
      ],
      exercises: [
        {
          id: 1,
          name: "Back Squat",
          sets: [
            { setNumber: 1, targetReps: 5, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 2, targetReps: 5, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 3, targetReps: 5, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 4, targetReps: 5, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 5, targetReps: 5, weight: null, completedReps: null, isCompleted: false },
          ],
          notes: "Focus on maintaining proper back position and depth. Brace core throughout the movement, keep chest up and drive through heels.",
          restTime: 180,
          video: "https://example.com/back-squat-video",
        },
        {
          id: 2,
          name: "Romanian Deadlift",
          sets: [
            { setNumber: 1, targetReps: 8, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 2, targetReps: 8, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 3, targetReps: 8, weight: null, completedReps: null, isCompleted: false },
            { setNumber: 4, targetReps: 8, weight: null, completedReps: null, isCompleted: false },
          ],
          notes: "Maintain slight bend in knees, focus on hip hinge. Keep back flat and shoulders retracted. Feel the stretch in hamstrings.",
          restTime: 120,
          video: "https://example.com/romanian-deadlift-video",
        },
        {
          id: 3,
          name: "Walking Lunges",
          sets: [
            { setNumber: 1, targetReps: "12 each", weight: null, completedReps: null, isCompleted: false },
            { setNumber: 2, targetReps: "12 each", weight: null, completedReps: null, isCompleted: false },
            { setNumber: 3, targetReps: "12 each", weight: null, completedReps: null, isCompleted: false },
          ],
          notes: "Take long strides, keep front knee tracking over toes. Maintain upright posture throughout the movement.",
          restTime: 90,
          video: "https://example.com/walking-lunges-video",
        },
        {
          id: 4,
          name: "Weighted Step-ups",
          sets: [
            { setNumber: 1, targetReps: "10 each", weight: null, completedReps: null, isCompleted: false },
            { setNumber: 2, targetReps: "10 each", weight: null, completedReps: null, isCompleted: false },
            { setNumber: 3, targetReps: "10 each", weight: null, completedReps: null, isCompleted: false },
          ],
          notes: "Drive through heel, maintain upright posture. Focus on controlled movement both up and down.",
          restTime: 90,
          video: "https://example.com/step-ups-video",
        },
      ],
      coolDown: [
        "Static stretching for quads, hamstrings, and calves",
        "Foam rolling for tight areas",
      ],
    };

    setWorkout(mockWorkout);
    setLoading(false);
    setStartTime(new Date());
  }, [id]);
  
  // Timer functionality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          // For rest timer, countdown
          if (isRestTimer && prev > 0) {
            return prev - 1;
          }
          // For workout timer, count up
          else if (!isRestTimer) {
            return prev + 1;
          }
          // If rest timer reaches 0, stop and notify
          else if (isRestTimer && prev === 0) {
            setIsTimerRunning(false);
            setIsRestTimer(false);
            toast.success("Rest complete! Continue your workout.");
            return 0;
          }
          return prev;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isRestTimer]);
  
  // Calculate total workout time
  useEffect(() => {
    if (startTime && !workoutCompleted) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setTotalTime(elapsed);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [startTime, workoutCompleted]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  const resetTimer = () => {
    // If it's a rest timer, reset to the original rest time
    if (isRestTimer) {
      const currentExercise = workout.exercises[activeExerciseIndex];
      if (currentExercise) {
        setTimer(currentExercise.restTime);
      } else {
        setTimer(0);
      }
    } else {
      // If it's the workout timer, reset to 0
      setTimer(0);
    }
    setIsTimerRunning(false);
  };
  
  const startRestTimer = (seconds: number) => {
    setTimer(seconds);
    setIsRestTimer(true);
    setIsTimerRunning(true);
    toast.info(`Rest timer started: ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`);
  };
  
  const updateSetData = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const newWorkout = { ...workout };
    
    if (field === "isCompleted") {
      newWorkout.exercises[exerciseIndex].sets[setIndex].isCompleted = value;
    } else if (field === "weight") {
      newWorkout.exercises[exerciseIndex].sets[setIndex].weight = value === "" ? null : Number(value);
    } else if (field === "completedReps") {
      newWorkout.exercises[exerciseIndex].sets[setIndex].completedReps = value === "" ? null : value;
    }
    
    setWorkout(newWorkout);
    
    // Check if all sets in this exercise are completed
    const allSetsCompleted = newWorkout.exercises[exerciseIndex].sets.every(
      (set: any) => set.isCompleted
    );
    
    // If all sets are completed, move to next exercise
    if (allSetsCompleted && exerciseIndex < newWorkout.exercises.length - 1) {
      setActiveExerciseIndex(exerciseIndex + 1);
    }
  };
  
  const handleCompleteWorkout = () => {
    // Calculate exercise completion percentage
    let totalSets = 0;
    let completedSets = 0;
    
    workout.exercises.forEach((exercise: any) => {
      exercise.sets.forEach((set: any) => {
        totalSets++;
        if (set.isCompleted) completedSets++;
      });
    });
    
    const completionPercentage = Math.round((completedSets / totalSets) * 100);
    
    setWorkoutCompleted(true);
    toast.success(`Workout completed! ${completionPercentage}% of sets completed. Great job!`);
  };
  
  if (loading || !workout) {
    return (
      <MobileLayout title="Workout">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }
  
  // Format total workout duration as MM:SS
  const formatTotalTime = () => {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <MobileLayout title="Workout">
      <div className="mobile-safe-area py-4">
        {/* Workout header */}
        <header className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">{workout.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock size={14} className="mr-1" />
              <span>{formatTotalTime()}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{workout.description}</p>
        </header>
        
        {/* Timer */}
        <WorkoutTimer
          timer={timer}
          isRunning={isTimerRunning}
          onToggle={toggleTimer}
          onReset={resetTimer}
          isRest={isRestTimer}
        />
        
        {/* Warm up section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Warm Up</h2>
          <div className="bg-card rounded-lg p-4 border border-border">
            <ul className="list-disc list-inside text-sm space-y-1">
              {workout.warmUp.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        
        {/* Exercises */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Exercises</h2>
          <div className="space-y-1">
            {workout.exercises.map((exercise: any, exerciseIndex: number) => (
              <ExerciseCard
                key={exercise.id}
                id={exercise.id}
                index={exerciseIndex}
                name={exercise.name}
                sets={exercise.sets}
                notes={exercise.notes}
                restTime={exercise.restTime}
                video={exercise.video}
                isActive={activeExerciseIndex === exerciseIndex}
                onSetComplete={(exerciseIndex, setIndex, isCompleted) => {
                  updateSetData(exerciseIndex, setIndex, "isCompleted", isCompleted);
                }}
                onSetDataChange={updateSetData}
                onRestTimerStart={startRestTimer}
              />
            ))}
          </div>
        </section>
        
        {/* Cool down section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Cool Down</h2>
          <div className="bg-card rounded-lg p-4 border border-border">
            <ul className="list-disc list-inside text-sm space-y-1">
              {workout.coolDown.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        
        {/* Complete workout button */}
        <div className="pb-6">
          <button 
            className={`btn-primary flex items-center justify-center space-x-2 ${
              workoutCompleted 
                ? "bg-green-600" 
                : "bg-gradient-to-r from-tactical-blue to-tactical-blue/80"
            }`}
            onClick={handleCompleteWorkout}
            disabled={workoutCompleted}
          >
            {workoutCompleted ? (
              <>
                <CheckCircle size={18} className="mr-2" />
                <span>Workout Completed!</span>
              </>
            ) : (
              <span>Complete Workout</span>
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Workout;
