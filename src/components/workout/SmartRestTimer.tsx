import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Minus, X, Volume2, VolumeX } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

interface SmartRestTimerProps {
  initialSeconds: number;
  isActive: boolean;
  onComplete?: () => void;
  onClose?: () => void;
}

const SmartRestTimer: React.FC<SmartRestTimerProps> = ({
  initialSeconds,
  isActive,
  onComplete,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [originalTime, setOriginalTime] = useState(initialSeconds);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const stored = localStorage.getItem("timerAudioEnabled");
    return stored !== null ? stored === "true" : true;
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { triggerHaptic, timerComplete } = useHapticFeedback();
  const { playTimerComplete } = useAudioFeedback();

  // Reset timer when new rest period starts
  useEffect(() => {
    if (isActive && initialSeconds > 0) {
      setTimeLeft(initialSeconds);
      setOriginalTime(initialSeconds);
      setIsPaused(false);
      triggerHaptic("light");
    }
  }, [isActive, initialSeconds, triggerHaptic]);

  // Timer countdown logic
  useEffect(() => {
    if (!isActive || isPaused || timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer complete!
          timerComplete();
          if (audioEnabled) {
            playTimerComplete();
          }
          onComplete?.();
          return 0;
        }
        
        // Haptic feedback at key intervals
        if (prev === 11) triggerHaptic("light"); // 10 seconds left
        if (prev === 6) triggerHaptic("medium"); // 5 seconds left
        if (prev === 4 || prev === 3 || prev === 2) triggerHaptic("light"); // Final countdown
        
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft, onComplete, triggerHaptic, timerComplete, audioEnabled, playTimerComplete]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    triggerHaptic("light");
  }, [triggerHaptic]);

  const resetTimer = useCallback(() => {
    setTimeLeft(originalTime);
    setIsPaused(false);
    triggerHaptic("medium");
  }, [originalTime, triggerHaptic]);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
    triggerHaptic("light");
  }, [triggerHaptic]);

  const toggleAudio = useCallback(() => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    localStorage.setItem("timerAudioEnabled", String(newValue));
    triggerHaptic("light");
  }, [audioEnabled, triggerHaptic]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = originalTime > 0 ? (timeLeft / originalTime) * 100 : 0;
  const isLowTime = timeLeft <= 10 && timeLeft > 0;
  const isComplete = timeLeft === 0;

  if (!isActive) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-16 z-50 mx-4 animate-fade-in ${
        isComplete ? "bg-primary" : isLowTime ? "bg-accent" : "bg-secondary"
      } rounded-xl border border-border shadow-lg transition-colors duration-300`}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-primary/30 rounded-t-xl w-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isLowTime ? "bg-accent-foreground" : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 pt-5">
        <div className="flex items-center justify-between">
          {/* Timer display */}
          <div className="flex items-center space-x-4">
            <div
              className={`text-4xl font-mono font-bold ${
                isComplete ? "text-primary-foreground" : isLowTime ? "text-accent-foreground" : "text-foreground"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <span
              className={`text-sm font-medium uppercase tracking-wide ${
                isComplete ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {isComplete ? "GO!" : isPaused ? "Paused" : "Rest"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* -30s button */}
            <button
              onClick={() => addTime(-30)}
              className="p-2 rounded-full bg-background/20 text-foreground hover:bg-background/30 transition-colors"
              aria-label="Subtract 30 seconds"
            >
              <Minus size={16} />
            </button>

            {/* +30s button */}
            <button
              onClick={() => addTime(30)}
              className="p-2 rounded-full bg-background/20 text-foreground hover:bg-background/30 transition-colors"
              aria-label="Add 30 seconds"
            >
              <Plus size={16} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePause}
              className={`p-3 rounded-full ${
                isComplete ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"
              } transition-colors`}
              aria-label={isPaused ? "Resume timer" : "Pause timer"}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full bg-background/20 text-foreground hover:bg-background/30 transition-colors"
              aria-label={audioEnabled ? "Mute timer sound" : "Enable timer sound"}
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Reset */}
            <button
              onClick={resetTimer}
              className="p-2 rounded-full bg-background/20 text-foreground hover:bg-background/30 transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw size={16} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-background/20 text-foreground hover:bg-background/30 transition-colors"
              aria-label="Close timer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartRestTimer;
