import { FileEdit, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SelectionInfoCardProps {
  selectionType: string | null;
  selectionDate: Date | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTypeChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
}

const SelectionInfoCard = ({
  selectionType,
  selectionDate,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onTypeChange,
  onDateChange
}: SelectionInfoCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-primary" />
          <h2 className="font-semibold">Selection Information</h2>
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
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Selection Type</label>
            <Select value={selectionType || ''} onValueChange={onTypeChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SFAS">Special Forces Assessment & Selection (SFAS)</SelectItem>
                <SelectItem value="RASP">Ranger Assessment & Selection Program (RASP)</SelectItem>
                <SelectItem value="A&S">Marine Raider Assessment & Selection (A&S)</SelectItem>
                <SelectItem value="BUD/S">Basic Underwater Demolition/SEAL (BUD/S)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Selection Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectionDate ? format(selectionDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectionDate}
                  onSelect={onDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Selection Type</span>
            <span className="font-medium">{selectionType || "Not set"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-muted-foreground">Selection Date</span>
            <span className="font-medium">
              {selectionDate ? format(selectionDate, "PPP") : "Not set"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionInfoCard;
