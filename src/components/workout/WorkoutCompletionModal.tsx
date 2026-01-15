import React, { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Target, Calendar, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: {
    title: string;
    totalTime: number; // in seconds
    setsCompleted: number;
    totalSets: number;
    exercisesCompleted: number;
    totalExercises: number;
  };
}

const WorkoutCompletionModal = ({
  isOpen,
  onClose,
  workoutData,
}: WorkoutCompletionModalProps) => {
  const navigate = useNavigate();
  const { timerComplete } = useHapticFeedback();

  useEffect(() => {
    if (isOpen) {
      timerComplete();
    }
  }, [isOpen, timerComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completionPercentage = Math.round(
    (workoutData.setsCompleted / workoutData.totalSets) * 100
  );

  const motivationalMessages = [
    "Outstanding work! 💪",
    "You crushed it! 🔥",
    "Beast mode activated! 🦁",
    "Another day stronger! ⚡",
    "Champion mentality! 🏆",
  ];

  const randomMessage =
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  const handleViewCalendar = () => {
    onClose();
    navigate("/calendar");
  };

  const handleContinue = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <div className="text-center space-y-6 py-4">
          {/* Trophy Icon */}
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center animate-bounce">
            <Trophy className="w-10 h-10 text-primary" />
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Workout Complete!</h2>
            <p className="text-lg text-primary font-medium">{randomMessage}</p>
            <p className="text-muted-foreground">{workoutData.title}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatTime(workoutData.totalTime)}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span className="text-xs">Completion</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {completionPercentage}%
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Flame className="w-4 h-4" />
                <span className="text-xs">Sets Done</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {workoutData.setsCompleted}/{workoutData.totalSets}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Exercises</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {workoutData.exercisesCompleted}/{workoutData.totalExercises}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleViewCalendar}
            >
              View Calendar
            </Button>
            <Button className="flex-1" onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutCompletionModal;
