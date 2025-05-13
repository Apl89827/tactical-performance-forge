
import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface CountdownTileProps {
  selectionDate: string | null;
  selectionType: string | null;
}

const CountdownTile: React.FC<CountdownTileProps> = ({ selectionDate, selectionType }) => {
  const calculateDaysLeft = (): number => {
    if (!selectionDate) return 0;
    
    const today = new Date();
    const targetDate = new Date(selectionDate);
    
    // Reset time portion for accurate day calculation
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysLeft > 0 ? daysLeft : 0;
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const daysLeft = calculateDaysLeft();
  
  if (!selectionDate || !selectionType) {
    return null;
  }
  
  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{selectionType}</h2>
        <div className="flex items-center text-tactical-blue">
          <CalendarIcon size={14} className="mr-1" />
          <span className="text-sm">{formatDate(selectionDate)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-3 bg-secondary/30 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-tactical-blue">{daysLeft}</div>
          <div className="text-xs text-muted-foreground">Days Remaining</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTile;
