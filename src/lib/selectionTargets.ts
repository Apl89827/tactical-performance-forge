// Target PT scores by selection type
// All times in decimal minutes (e.g. 9.5 = 9:30)
// All reps are max reps

export interface SelectionTargets {
  runTime?: number;     // 1.5-mile run, decimal minutes (lower = better)
  pushups?: number;     // max reps
  situps?: number;      // max reps
  pullups?: number;     // max reps
  swimTime?: number;    // 500m swim, decimal minutes (lower = better)
  label: string;        // display name
}

export const SELECTION_TARGETS: Record<string, SelectionTargets> = {
  "BUD/S": {
    label: "BUD/S",
    runTime: 9.5,    // 9:30
    pushups: 80,
    situps: 80,
    pullups: 15,
    swimTime: 8.5,   // 8:30 sidestroke 500yd
  },
  "SFAS": {
    label: "SFAS",
    runTime: 9.0,    // 9:00
    pushups: 70,
    situps: 70,
    pullups: 12,
  },
  "RASP": {
    label: "RASP",
    runTime: 9.0,
    pushups: 70,
    situps: 70,
    pullups: 12,
  },
  "A&S": {
    label: "A&S (Marine Raiders)",
    runTime: 9.5,
    pushups: 70,
    situps: 70,
    pullups: 15,
  },
  "PJ/CCT": {
    label: "PJ/CCT",
    runTime: 9.0,
    pushups: 75,
    situps: 75,
    pullups: 15,
    swimTime: 9.0,
  },
  "SWCC": {
    label: "SWCC",
    runTime: 10.0,
    pushups: 60,
    situps: 60,
    pullups: 10,
    swimTime: 10.0,
  },
  "FBI HRT": {
    label: "FBI HRT",
    runTime: 9.5,
    pushups: 65,
    situps: 65,
    pullups: 12,
  },
  "Other": {
    label: "Selection",
    runTime: 9.5,
    pushups: 70,
    situps: 70,
    pullups: 12,
  },
};

// PT test milestone schedule: weeks before selection date to test
// These become calendar markers
export const PT_MILESTONE_WEEKS_BEFORE = [12, 8, 4, 2, 1];

export const getMilestoneLabel = (weeksOut: number): string => {
  if (weeksOut >= 12) return "PT Check — 12wk out";
  if (weeksOut >= 8)  return "PT Check — 8wk out";
  if (weeksOut >= 4)  return "PT Check — 4wk out";
  if (weeksOut >= 2)  return "PT Check — 2wk out";
  return "Final PT Check";
};

// Calculate what % of target to aim for at each milestone
export const getMilestoneTargetPct = (weeksOut: number): number => {
  if (weeksOut >= 12) return 0.75;
  if (weeksOut >= 8)  return 0.85;
  if (weeksOut >= 4)  return 0.92;
  if (weeksOut >= 2)  return 0.97;
  return 1.0;
};
