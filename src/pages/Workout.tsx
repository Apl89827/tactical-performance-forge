
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MobileLayout from "../components/layouts/MobileLayout";
import { Play, Pause, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const Workout = () => {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<number[]>([0]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
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
          notes: "Focus on maintaining proper back position and depth",
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
          notes: "Maintain slight bend in knees, focus on hip hinge",
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
          notes: "Take long strides, keep front knee tracking over toes",
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
          notes: "Drive through heel, maintain upright posture",
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
  }, [id]);
  
  // Timer functionality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  const resetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
  };
  
  const startRestTimer = (seconds: number) => {
    setTimer(seconds);
    setIsTimerRunning(true);
    toast.info(`Rest timer set for ${formatTime(seconds)}`);
  };
  
  const toggleExerciseExpand = (index: number) => {
    if (expandedExercises.includes(index)) {
      setExpandedExercises(expandedExercises.filter((i) => i !== index));
    } else {
      setExpandedExercises([...expandedExercises, index]);
    }
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
  };
  
  const handleCompleteWorkout = () => {
    setWorkoutCompleted(true);
    toast.success("Workout completed! Great job!");
  };
  
  const isExerciseExpanded = (index: number) => {
    return expandedExercises.includes(index);
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
  
  return (
    <MobileLayout title="Workout">
      <div className="mobile-safe-area py-4">
        {/* Workout header */}
        <header className="mb-4">
          <h1 className="text-xl font-bold">{workout.title}</h1>
          <p className="text-muted-foreground text-sm">{workout.description}</p>
        </header>
        
        {/* Timer */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-mono font-bold">{formatTime(timer)}</div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={toggleTimer}
              className="p-2 rounded-full bg-tactical-blue/20 text-tactical-blue"
            >
              {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 rounded-full bg-secondary text-muted-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
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
          <div className="space-y-4">
            {workout.exercises.map((exercise: any, exerciseIndex: number) => (
              <div 
                key={exercise.id} 
                className={`bg-card rounded-lg border ${
                  activeExerciseIndex === exerciseIndex
                    ? "border-tactical-blue"
                    : "border-border"
                }`}
              >
                {/* Exercise header */}
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => toggleExerciseExpand(exerciseIndex)}
                >
                  <div className="flex items-center">
                    <span className="bg-secondary h-6 w-6 rounded-full flex items-center justify-center mr-3 text-xs">
                      {exerciseIndex + 1}
                    </span>
                    <h3 className="font-medium">{exercise.name}</h3>
                  </div>
                  {isExerciseExpanded(exerciseIndex) ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  )}
                </div>
                
                {/* Exercise content when expanded */}
                {isExerciseExpanded(exerciseIndex) && (
                  <div className="px-4 pb-4">
                    {/* Video placeholder */}
                    <div className="aspect-video bg-tactical-blue/10 mb-4 rounded flex items-center justify-center">
                      <Play size={32} className="text-tactical-blue" />
                    </div>
                    
                    {/* Notes */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Form Notes:</h4>
                      <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                    </div>
                    
                    {/* Sets */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Sets:</h4>
                      
                      <div className="space-y-3">
                        {exercise.sets.map((set: any, setIndex: number) => (
                          <div 
                            key={setIndex} 
                            className={`flex items-center space-x-3 p-3 rounded-md ${
                              set.isCompleted ? "bg-tactical-blue/10" : "bg-secondary/30"
                            }`}
                          >
                            <div className="w-6 text-center">
                              <span className="text-sm">{set.setNumber}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={set.weight || ""}
                                  onChange={(e) => updateSetData(exerciseIndex, setIndex, "weight", e.target.value)}
                                  className="w-16 p-2 text-center rounded bg-background border border-border"
                                  placeholder="lbs"
                                />
                                <span className="text-sm text-muted-foreground">×</span>
                                <input
                                  type="text"
                                  value={set.completedReps || ""}
                                  onChange={(e) => updateSetData(exerciseIndex, setIndex, "completedReps", e.target.value)}
                                  className="w-16 p-2 text-center rounded bg-background border border-border"
                                  placeholder={set.targetReps.toString()}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                updateSetData(exerciseIndex, setIndex, "isCompleted", !set.isCompleted);
                                if (!set.isCompleted) {
                                  startRestTimer(exercise.restTime);
                                }
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                set.isCompleted
                                  ? "bg-tactical-blue text-white"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {set.isCompleted && <Check size={16} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Rest timer button */}
                    <button
                      onClick={() => startRestTimer(exercise.restTime)}
                      className="w-full p-2 text-sm bg-secondary rounded flex items-center justify-center space-x-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v6l4 2M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Start {exercise.restTime / 60} min rest</span>
                    </button>
                  </div>
                )}
              </div>
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
            className={`btn-primary ${workoutCompleted ? "bg-green-600" : ""}`}
            onClick={handleCompleteWorkout}
            disabled={workoutCompleted}
          >
            {workoutCompleted ? "Workout Completed!" : "Complete Workout"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Workout;
