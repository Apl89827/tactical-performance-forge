import { FileEdit, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PhysicalMetricsCardProps {
  height?: number;
  weight?: number;
  isEditing: boolean;
  editHeight?: number;
  editWeight?: number;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onHeightChange: (value: number | undefined) => void;
  onWeightChange: (value: number | undefined) => void;
}

const PhysicalMetricsCard = ({
  height,
  weight,
  isEditing,
  editHeight,
  editWeight,
  onEdit,
  onSave,
  onCancel,
  onHeightChange,
  onWeightChange
}: PhysicalMetricsCardProps) => {
  const formatHeight = (inches?: number) => {
    if (!inches) return "--";
    return `${Math.floor(inches / 12)}' ${inches % 12}"`;
  };

  return (
    <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Ruler size={18} className="text-primary" />
          <h2 className="font-semibold">Physical Metrics</h2>
        </div>
        {!isEditing && (
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={onEdit}
          >
            <FileEdit size={16} className="text-primary" />
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Height (inches)</label>
            <Input 
              type="number" 
              value={editHeight || ''} 
              onChange={(e) => onHeightChange(e.target.value ? parseInt(e.target.value) : undefined)} 
              placeholder="Height in inches"
              className="bg-background"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Weight (lbs)</label>
            <Input 
              type="number" 
              value={editWeight || ''} 
              onChange={(e) => onWeightChange(e.target.value ? parseInt(e.target.value) : undefined)} 
              placeholder="Weight in pounds"
              className="bg-background"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Height</span>
            <span className="font-medium">{formatHeight(height)}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Weight</span>
            <span className="font-medium">{weight ? `${weight} lbs` : "--"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalMetricsCard;
