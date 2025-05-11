
import React, { useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface WorkoutTimerProps {
  timer: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  isRest?: boolean;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  timer,
  isRunning,
  onToggle,
  onReset,
  isRest = false,
}) => {
  const timerRef = useRef<HTMLDivElement>(null);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Add pulse animation when timer is running
  useEffect(() => {
    if (timerRef.current) {
      if (isRunning) {
        timerRef.current.classList.add('pulse-subtle');
      } else {
        timerRef.current.classList.remove('pulse-subtle');
      }
    }
  }, [isRunning]);
  
  return (
    <div 
      className={`rounded-lg p-3 mb-4 flex items-center justify-between transition-colors ${
        isRest 
          ? "bg-tactical-orange/20 border border-tactical-orange/30" 
          : "bg-secondary/50"
      }`}
    >
      <div className="flex items-center">
        <div 
          ref={timerRef}
          className={`text-2xl font-mono font-bold ${isRest ? "text-tactical-orange" : ""}`}
        >
          {formatTime(timer)}
        </div>
        {isRest && (
          <span className="ml-2 text-sm text-tactical-orange font-medium">REST</span>
        )}
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={onToggle}
          className={`p-2 rounded-full ${
            isRest
              ? "bg-tactical-orange/20 text-tactical-orange"
              : "bg-tactical-blue/20 text-tactical-blue"
          }`}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-full bg-secondary text-muted-foreground"
          aria-label="Reset timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutTimer;
