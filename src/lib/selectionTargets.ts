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
    runTime: 9.5,
    pushups: 80,
    situps: 80,
    pullups: 15,
    swimTime: 8.5,
  },
  "SFAS": { label: "SFAS", runTime: 9.0, pushups: 70, situps: 70, pullups: 12 },
  "RASP": { label: "RASP", runTime: 9.0, pushups: 70, situps: 70, pullups: 12 },
  "A&S": { label: "A&S (Marine Raiders)", runTime: 9.5, pushups: 70, situps: 70, pullups: 15 },
  "PJ/CCT": { label: "PJ/CCT", runTime: 9.0, pushups: 75, situps: 75, pullups: 15, swimTime: 9.0 },
  "SWCC": { label: "SWCC", runTime: 10.0, pushups: 60, situps: 60, pullups: 10, swimTime: 10.0 },
  "FBI HRT": { label: "FBI HRT", runTime: 9.5, pushups: 65, situps: 65, pullups: 12 },
  "Other": { label: "Selection", runTime: 9.5, pushups: 70, situps: 70, pullups: 12 },
};
export const PT_MILESTONE_WEEKS_BEFORE = [12, 8, 4, 2, 1];
export const getMilestoneLabel = (w: number): string => w>=12?"PT Check - 12wk out":w>=8?"PT Check - 8wk out":w>=4?"PT Check - 4wk out":w>=2?"PT Check - 2wk out":"Final PT Check";
export const getMilestoneTargetPct = (w: number): number => w>=12?0.75:w>=8?0.85:w>=4?0.92:w>=2?0.97:1.0;