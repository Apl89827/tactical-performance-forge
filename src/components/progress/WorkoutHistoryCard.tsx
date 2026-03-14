import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
interface SetLog { exercise_index: number; set_number: number; actual_weight: number | null; actual_reps: number | null; completed: boolean; }
interface WorkoutHistoryCardProps { id: string; title: string; dayType: string | null; date: string; completedAt: string | null; setLogs: SetLog[]; exerciseNames: string[]; }
const WorkoutHistoryCard: React.FC<WorkoutHistoryCardProps> = ({ title, dayType, date, completedAt, setLogs, exerciseNames }) => {
  const [expanded, setExpanded] = useState(false);
  const totalSets = setLogs.length;
  const completedSets = setLogs.filter((s) => s.completed).length;
  const totalVolume = setLogs.reduce((acc, s) => acc + (s.actual_weight || 0) * (s.actual_reps || 0), 0);
  const formattedDate = new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const duration = (() => { if (!completedAt) return null; const mins = Math.round((new Date(completedAt).getTime() - new Date(date).getTime()) / 60000); return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`; })();
  const byExercise: Record<number, SetLog[]> = {};
  setLogs.forEach((s) => { if (!byExercise[s.exercise_index]) byExercise[s.exercise_index] = []; byExercise[s.exercise_index].push(s); });
  return ( <div className="bg-card rounded-xl border border-border overflow-hidden"> <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setExpanded((p) => !p)}> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2 mb-1"> <CheckCircle size={14} className="text-green-500 shrink-0" /> <h3 className="font-medium truncate">{title}</h3> </div> <div className="flex items-center gap-3 text-xs text-muted-foreground"> <span>{formattedDate}</span> {dayType && <span>{dayType}</span>} {duration && <span>{duration}</span>} </div> </div> <div className="text-right ml-3 shrink-0"> <p className="text-sm font-medium">{completedSets}/{totalSets} sets</p> {totalVolume > 0 && <p className="text-xs text-muted-foreground">{totalVolume.toLocaleString()} lbs vol</p>} </div> <div className="ml-2"> {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />} </div> </button> {expanded && <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-in"> {Object.entries(byExercise).map(([exIdx, sets]) => { const name = exerciseNames[parseInt(exIdx)] || `Exercise ${parseInt(exIdx) + 1}`; return <div key={exIdx}> <p className="text-sm font-medium capitalize mb-1">{name.replace(/^ex_/,"").replace(/_/g," ")}</p> <div className="flex flex-wrap gap-1.5"> {sets.sort((a,b) => a.set_number-b.set_number).map((s,i) => <div key={i} className={`px-2.5 py-1 rounded-md text-xs ${s.completed?"bg-primary/10 text-primary":"bg-secondary text-muted-foreground"}`}>{s.actual_weight?`${s.actual_weight}`:""}{s.actual_reps||"—"}</div>)} </div> </div>; })} </div>} </div> );
};
export default WorkoutHistoryCard;
