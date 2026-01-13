import React, { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface StartProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    id: string;
    title: string;
    durationWeeks: number;
    daysPerWeek: number;
  } | null;
  onConfirm: (programId: string, startDate: Date) => void;
  isLoading?: boolean;
}

const StartProgramModal: React.FC<StartProgramModalProps> = ({
  open,
  onOpenChange,
  program,
  onConfirm,
  isLoading = false,
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());

  if (!program) return null;

  const endDate = addDays(startDate, program.durationWeeks * 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start {program.title}</DialogTitle>
          <DialogDescription>
            This {program.durationWeeks}-week program includes {program.daysPerWeek} training days per week.
            Choose your start date below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Program Start</span>
              <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Program End</span>
              <span className="font-medium">{format(endDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Workouts</span>
              <span className="font-medium">{program.durationWeeks * program.daysPerWeek}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(program.id, startDate)}
            disabled={isLoading}
          >
            {isLoading ? "Generating Schedule..." : "Start Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartProgramModal;
