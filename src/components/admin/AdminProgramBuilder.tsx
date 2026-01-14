import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Search,
  Eye,
  Upload,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgramImporter from "./ProgramImporter";

interface Movement {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  video_url?: string;
}

interface Exercise {
  id?: string;
  movement_name: string;
  sets: number;
  reps: number;
  notes?: string;
  order_position: number;
  is_bodyweight_percentage?: boolean;
  bodyweight_percentage?: number;
  week_number?: number;
  day_of_week?: number;
}

interface Program {
  id?: string;
  title: string;
  description?: string;
  program_type?: string;
  duration_weeks?: number;
  days_per_week?: number;
  is_public?: boolean;
  exercises: Exercise[];
}

const AdminProgramBuilder = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchMovements();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const programsWithExercises = await Promise.all(
        (data || []).map(async (program) => {
          const { data: exercises } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('program_id', program.id)
            .order('order_position', { ascending: true });
          
          return { ...program, exercises: exercises || [] };
        })
      );
      
      setPrograms(programsWithExercises);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('movement_library')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
    }
  };

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(movements.map(m => m.category))];

  const createNewProgram = () => {
    setCurrentProgram({
      title: "",
      description: "",
      program_type: "strength",
      duration_weeks: 8,
      days_per_week: 4,
      is_public: false,
      exercises: []
    });
    setIsEditing(true);
  };

  const editProgram = (program: Program) => {
    setCurrentProgram({ ...program });
    setIsEditing(true);
  };

  const addExerciseFromLibrary = (movement: Movement) => {
    if (!currentProgram) return;
    
    const newExercise: Exercise = {
      movement_name: movement.name,
      sets: 3,
      reps: 10,
      order_position: currentProgram.exercises.length,
      is_bodyweight_percentage: false,
      bodyweight_percentage: 45
    };
    
    setCurrentProgram({
      ...currentProgram,
      exercises: [...currentProgram.exercises, newExercise]
    });
    toast.success(`Added ${movement.name}`);
  };

  const addCustomExercise = () => {
    if (!currentProgram) return;
    
    const newExercise: Exercise = {
      movement_name: "",
      sets: 3,
      reps: 10,
      order_position: currentProgram.exercises.length,
      is_bodyweight_percentage: false,
      bodyweight_percentage: 45
    };
    
    setCurrentProgram({
      ...currentProgram,
      exercises: [...currentProgram.exercises, newExercise]
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    if (!currentProgram) return;
    
    const updatedExercises = [...currentProgram.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setCurrentProgram({ ...currentProgram, exercises: updatedExercises });
  };

  const removeExercise = (index: number) => {
    if (!currentProgram) return;
    
    const updatedExercises = currentProgram.exercises
      .filter((_, i) => i !== index)
      .map((ex, i) => ({ ...ex, order_position: i }));
    
    setCurrentProgram({ ...currentProgram, exercises: updatedExercises });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (!currentProgram) return;
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === currentProgram.exercises.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedExercises = [...currentProgram.exercises];
    [updatedExercises[index], updatedExercises[newIndex]] = 
      [updatedExercises[newIndex], updatedExercises[index]];
    updatedExercises.forEach((ex, i) => { ex.order_position = i; });
    
    setCurrentProgram({ ...currentProgram, exercises: updatedExercises });
  };

  const saveProgram = async (publish: boolean = false) => {
    if (!currentProgram) return;
    
    if (!currentProgram.title.trim()) {
      toast.error("Program title is required");
      return;
    }

    try {
      let programId = currentProgram.id;
      
      const programData = {
        title: currentProgram.title,
        description: currentProgram.description,
        program_type: currentProgram.program_type,
        duration_weeks: currentProgram.duration_weeks,
        days_per_week: currentProgram.days_per_week,
        is_public: publish
      };

      if (programId) {
        const { error } = await supabase
          .from('workout_programs')
          .update(programData)
          .eq('id', programId);
        if (error) throw error;
        
        await supabase
          .from('workout_exercises')
          .delete()
          .eq('program_id', programId);
      } else {
        const { data, error } = await supabase
          .from('workout_programs')
          .insert(programData)
          .select()
          .single();
        if (error) throw error;
        programId = data.id;
      }

      if (currentProgram.exercises.length > 0) {
        const exercisesToInsert = currentProgram.exercises.map((ex, i) => ({
          program_id: programId,
          movement_name: ex.movement_name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
          order_position: i,
          is_bodyweight_percentage: ex.is_bodyweight_percentage || false,
          bodyweight_percentage: ex.bodyweight_percentage || null,
          week_number: ex.week_number,
          day_of_week: ex.day_of_week
        }));

        const { error } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert);
        if (error) throw error;
      }

      toast.success(publish ? "Program published!" : "Program saved as draft");
      setIsEditing(false);
      setCurrentProgram(null);
      fetchPrograms();
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("Failed to save program");
    }
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm("Delete this program? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from('workout_programs')
        .delete()
        .eq('id', programId);
      if (error) throw error;
      
      toast.success("Program deleted");
      fetchPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program");
    }
  };

  const togglePublish = async (program: Program) => {
    try {
      const { error } = await supabase
        .from('workout_programs')
        .update({ is_public: !program.is_public })
        .eq('id', program.id);
      if (error) throw error;
      
      toast.success(program.is_public ? "Program unpublished" : "Program published");
      fetchPrograms();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update program");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isEditing && currentProgram) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {currentProgram.id ? 'Edit Program' : 'Create Program'}
          </h2>
          <Button variant="ghost" onClick={() => { setIsEditing(false); setCurrentProgram(null); }}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Program Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={currentProgram.title}
                  onChange={(e) => setCurrentProgram({ ...currentProgram, title: e.target.value })}
                  placeholder="e.g., 12-Week SFAS Prep"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={currentProgram.description || ''}
                  onChange={(e) => setCurrentProgram({ ...currentProgram, description: e.target.value })}
                  placeholder="Program goals and details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={currentProgram.program_type || 'strength'}
                    onValueChange={(v) => setCurrentProgram({ ...currentProgram, program_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="sfas">SFAS Prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (weeks)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentProgram.duration_weeks || 8}
                    onChange={(e) => setCurrentProgram({ ...currentProgram, duration_weeks: parseInt(e.target.value) || 8 })}
                  />
                </div>
              </div>
              <div>
                <Label>Days per Week</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={currentProgram.days_per_week || 4}
                  onChange={(e) => setCurrentProgram({ ...currentProgram, days_per_week: parseInt(e.target.value) || 4 })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Movement Library Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movement Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search movements..."
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredMovements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No movements found</p>
                ) : (
                  filteredMovements.slice(0, 20).map(movement => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => addExerciseFromLibrary(movement)}
                    >
                      <div>
                        <p className="font-medium text-sm">{movement.name}</p>
                        <p className="text-xs text-muted-foreground">{movement.category}</p>
                      </div>
                      <PlusCircle className="h-4 w-4 text-primary" />
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={addCustomExercise}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Custom Exercise
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Exercises ({currentProgram.exercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentProgram.exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No exercises added. Search the movement library or add a custom exercise.
              </div>
            ) : (
              <div className="space-y-3">
                {currentProgram.exercises.map((exercise, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-background">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-3">
                        <Input
                          value={exercise.movement_name}
                          onChange={(e) => updateExercise(index, 'movement_name', e.target.value)}
                          placeholder="Exercise name"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              min="1"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={exercise.is_bodyweight_percentage || false}
                            onCheckedChange={(checked) => updateExercise(index, 'is_bodyweight_percentage', checked)}
                          />
                          <Label className="text-xs">Calculate as % of bodyweight</Label>
                          {exercise.is_bodyweight_percentage && (
                            <Input
                              type="number"
                              className="w-20 ml-2"
                              value={exercise.bodyweight_percentage || 45}
                              onChange={(e) => updateExercise(index, 'bodyweight_percentage', parseInt(e.target.value))}
                            />
                          )}
                        </div>
                        <Textarea
                          value={exercise.notes || ''}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Notes (optional)"
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveExercise(index, 'up')} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveExercise(index, 'down')} disabled={index === currentProgram.exercises.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeExercise(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => saveProgram(false)}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={() => saveProgram(true)}>
            <Globe className="h-4 w-4 mr-2" />
            Publish to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Workout Programs</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Program</DialogTitle>
              </DialogHeader>
              <ProgramImporter onImported={fetchPrograms} />
            </DialogContent>
          </Dialog>
          <Button onClick={createNewProgram}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({programs.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({programs.filter(p => p.is_public).length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({programs.filter(p => !p.is_public).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ProgramList 
            programs={programs} 
            onEdit={editProgram} 
            onDelete={deleteProgram}
            onTogglePublish={togglePublish}
          />
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          <ProgramList 
            programs={programs.filter(p => p.is_public)} 
            onEdit={editProgram} 
            onDelete={deleteProgram}
            onTogglePublish={togglePublish}
          />
        </TabsContent>
        <TabsContent value="drafts" className="mt-4">
          <ProgramList 
            programs={programs.filter(p => !p.is_public)} 
            onEdit={editProgram} 
            onDelete={deleteProgram}
            onTogglePublish={togglePublish}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ProgramListProps {
  programs: Program[];
  onEdit: (program: Program) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (program: Program) => void;
}

const ProgramList = ({ programs, onEdit, onDelete, onTogglePublish }: ProgramListProps) => {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
        No programs found
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {programs.map(program => (
        <Card key={program.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{program.title}</h3>
                  <Badge variant={program.is_public ? "default" : "secondary"}>
                    {program.is_public ? "Published" : "Draft"}
                  </Badge>
                </div>
                {program.description && (
                  <p className="text-sm text-muted-foreground mb-2">{program.description}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {program.program_type && <span className="capitalize">{program.program_type}</span>}
                  {program.duration_weeks && <span>{program.duration_weeks} weeks</span>}
                  {program.days_per_week && <span>{program.days_per_week} days/week</span>}
                  <span>{program.exercises.length} exercises</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onTogglePublish(program)}>
                  {program.is_public ? <Eye className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(program)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(program.id!)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminProgramBuilder;
