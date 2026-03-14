import React, { useEffect, useState } from "react";
import { X, Play, Pause } from "lucide-react";
interface StickyRestTimerProps { seconds: number; isRunning: boolean; isRest: boolean; onToggle: () => void; onDismiss: () => void; }
const StickyRestTimer: React.FC<StickyRestTimerProps> = ({ seconds, isRunning, isRest, onToggle, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (isRest && seconds > 0) { setVisible(true); } else if (!isRest || seconds === 0) { setVisible(false); } }, [isRest, seconds]);
  if (!visible) return null;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${minutes}:${String(secs).padStart(2, "0")}`;
  const totalEstimate = seconds <= 90 ? 90 : 180;
  const pct = Math.min(100, (seconds / totalEstimate) * 100);
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-1 animate-slide-up" style={{ pointerEvents: "auto" }}>
      <div className="bg-card border border-primary/30 rounded-xl shadow-lg overflow-hidden">
        <div className="h-0.5 bg-secondary w-full"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
        <div className="flex items-center px-4 py-2.5 gap-3">
          <div className="flex-1"><p className="text-xs text-muted-foreground leading-none mb-0.5">Rest timer</p><p className="text-xl font-bold tabular-nums text-primary leading-none">{display}</p></div>
          <button onClick={onToggle} className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">{isRunning ? <Pause size={16} /> : <Play size={16} />}</button>
          <button onClick={onDismiss} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors"><X size={16} /></button>
        </div>
      </div>
    </div>
  );
};
export default StickyRestTimer;
