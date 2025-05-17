import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Users 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Exercise {
  id?: string;
  movement_name: string;
  sets: number;
  reps: number;
  notes?: string;
  order_position: number;
  is_bodyweight_percentage?: boolean;
  bodyweight_percentage?: number;
}

interface Program {
  id?: string;
  title: string;
  description?: string;
  exercises: Exercise[];
}

const ProgramCreator = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProgram, setCurrentProgram] = useState<Program>({
    title: "",
    description: "",
    exercises: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // Load all workout programs
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      
      // Get all workout programs
      const { data: programsData, error: programsError } = await supabase
        .from('workout_programs')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (programsError) throw programsError;
      
      const populatedPrograms = await Promise.all(
        programsData.map(async (program) => {
          // Get exercises for each program
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('program_id', program.id)
            .order('order_position', { ascending: true });
            
          if (exercisesError) throw exercisesError;
          
          return {
            ...program,
            exercises: exercisesData || []
          };
        })
      );
      
      setPrograms(populatedPrograms);
    } catch (error) {
      console.error("Error loading workout programs:", error);
      toast.error("Failed to load workout programs");
    } finally {
      setLoading(false);
    }
  };

  const createNewProgram = () => {
    setCurrentProgram({
      title: "",
      description: "",
      exercises: []
    });
    setIsEditing(true);
  };

  const editProgram = (program: Program) => {
    setCurrentProgram({...program});
    setIsEditing(true);
  };

  const addExercise = () => {
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
    const updatedExercises = [...currentProgram.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    
    setCurrentProgram({
      ...currentProgram,
      exercises: updatedExercises
    });
  };

  const removeExercise = (index: number) => {
    const updatedExercises = currentProgram.exercises
      .filter((_, i) => i !== index)
      .map((ex, i) => ({ ...ex, order_position: i }));
    
    setCurrentProgram({
      ...currentProgram,
      exercises: updatedExercises
    });
  };
  
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === currentProgram.exercises.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedExercises = [...currentProgram.exercises];
    
    // Swap the exercises
    [updatedExercises[index], updatedExercises[newIndex]] = 
      [updatedExercises[newIndex], updatedExercises[index]];
    
    // Update order positions
    updatedExercises.forEach((ex, i) => {
      ex.order_position = i;
    });
    
    setCurrentProgram({
      ...currentProgram,
      exercises: updatedExercises
    });
  };

  const saveProgram = async () => {
    try {
      if (!currentProgram.title) {
        toast.error("Program title is required");
        return;
      }

      if (currentProgram.exercises.length === 0) {
        toast.error("Add at least one exercise to the program");
        return;
      }
      
      // Check if all exercises have names
      const invalidExercises = currentProgram.exercises.some(e => !e.movement_name.trim());
      if (invalidExercises) {
        toast.error("All exercises must have names");
        return;
      }

      let programId = currentProgram.id;
      
      if (programId) {
        // Update existing program
        const { error: updateError } = await supabase
          .from('workout_programs')
          .update({ 
            title: currentProgram.title,
            description: currentProgram.description 
          })
          .eq('id', programId);
          
        if (updateError) throw updateError;
        
        // Delete all exercises and recreate them to handle reordering
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('program_id', programId);
          
        if (deleteError) throw deleteError;
        
      } else {
        // Create new program
        const { data, error } = await supabase
          .from('workout_programs')
          .insert({ 
            title: currentProgram.title,
            description: currentProgram.description 
          })
          .select()
          .single();
          
        if (error) throw error;
        programId = data.id;
      }
      
      // Insert all exercises
      const exercisesToInsert = currentProgram.exercises.map((exercise, index) => ({
        program_id: programId,
        movement_name: exercise.movement_name,
        sets: exercise.sets,
        reps: exercise.reps,
        notes: exercise.notes,
        order_position: index,
        is_bodyweight_percentage: exercise.is_bodyweight_percentage || false,
        bodyweight_percentage: exercise.bodyweight_percentage || null
      }));
      
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert);
        
      if (exercisesError) throw exercisesError;
      
      toast.success(`Workout program ${programId ? 'updated' : 'created'} successfully`);
      setIsEditing(false);
      fetchPrograms();
      
    } catch (error) {
      console.error("Error saving workout program:", error);
      toast.error("Failed to save workout program");
    }
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('workout_programs')
        .delete()
        .eq('id', programId);
        
      if (error) throw error;
      
      toast.success("Workout program deleted successfully");
      setPrograms(programs.filter(p => p.id !== programId));
      
    } catch (error) {
      console.error("Error deleting workout program:", error);
      toast.error("Failed to delete workout program");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-xl font-bold">Workout Programs</h2>
        {!isEditing && (
          <Button onClick={createNewProgram} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Program
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 rounded-md border border-border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">
            {currentProgram.id ? 'Edit Program' : 'Create Program'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="program-title">Program Title</Label>
              <Input 
                id="program-title"
                value={currentProgram.title} 
                onChange={(e) => setCurrentProgram({...currentProgram, title: e.target.value})} 
                placeholder="e.g., 12-Week SFAS Preparation"
              />
            </div>
            
            <div>
              <Label htmlFor="program-description">Description (Optional)</Label>
              <Textarea 
                id="program-description"
                value={currentProgram.description || ''} 
                onChange={(e) => setCurrentProgram({...currentProgram, description: e.target.value})} 
                placeholder="Program details and objectives..."
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Exercises</Label>
                <Button variant="outline" size="sm" onClick={addExercise} className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Exercise
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {currentProgram.exercises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                    No exercises added. Click "Add Exercise" to start building your program.
                  </div>
                ) : (
                  currentProgram.exercises.map((exercise, index) => (
                    <div key={index} className="p-3 border rounded-md bg-background">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={exercise.movement_name}
                            onChange={(e) => updateExercise(index, 'movement_name', e.target.value)}
                            placeholder="Exercise name"
                            className="mb-2"
                          />
                          
                          <div className="flex gap-2 mb-2">
                            <div className="w-1/2">
                              <Label className="text-xs">Sets</Label>
                              <Input
                                type="number"
                                min="1"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div className="w-1/2">
                              <Label className="text-xs">Reps</Label>
                              <Input
                                type="number"
                                min="1"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 mb-2">
                            <Checkbox 
                              id={`bodyweight-percentage-${index}`}
                              checked={exercise.is_bodyweight_percentage || false}
                              onCheckedChange={(checked) => {
                                updateExercise(index, 'is_bodyweight_percentage', checked);
                                if (!exercise.bodyweight_percentage) {
                                  updateExercise(index, 'bodyweight_percentage', 45);
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label 
                                htmlFor={`bodyweight-percentage-${index}`}
                                className="text-xs"
                              >
                                Calculate weight as % of body weight
                              </Label>
                            </div>
                          </div>

                          {exercise.is_bodyweight_percentage && (
                            <div className="mb-2">
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  max="200"
                                  value={exercise.bodyweight_percentage || 45}
                                  onChange={(e) => updateExercise(index, 'bodyweight_percentage', parseInt(e.target.value) || 45)}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% of body weight</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Weight will be automatically calculated for each athlete
                              </p>
                            </div>
                          )}
                          
                          <Textarea
                            value={exercise.notes || ''}
                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                            placeholder="Notes (optional)"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => moveExercise(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => moveExercise(index, 'down')}
                            disabled={index === currentProgram.exercises.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeExercise(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={saveProgram}>
              <Save className="mr-2 h-4 w-4" />
              Save Program
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
              No workout programs created yet. Click "New Program" to get started.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {programs.map((program) => (
                <AccordionItem key={program.id} value={program.id || 'new'}>
                  <AccordionTrigger className="hover:bg-muted px-4 rounded-t-md">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{program.title}</span>
                      <Badge className="ml-2">{program.exercises.length} exercises</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-x border-b rounded-b-md p-4">
                    {program.description && (
                      <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                    )}
                    
                    <div className="space-y-3 mb-4">
                      {program.exercises.map((exercise, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{exercise.movement_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                              </div>
                              {exercise.is_bodyweight_percentage && (
                                <div className="text-sm">
                                  <Badge variant="success" className="mt-1">
                                    {exercise.bodyweight_percentage}% of body weight
                                  </Badge>
                                </div>
                              )}
                              {exercise.notes && (
                                <div className="text-xs mt-1">{exercise.notes}</div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => editProgram(program)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => deleteProgram(program.id || '')}
                      >
                        Delete
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="ml-auto">
                            <Users className="mr-2 h-4 w-4" />
                            Assign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Program to Users</DialogTitle>
                          </DialogHeader>
                          <ProgramAssignment programId={program.id || ''} programTitle={program.title} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
};

interface ProgramAssignmentProps {
  programId: string;
  programTitle: string;
}

const ProgramAssignment: React.FC<ProgramAssignmentProps> = ({ programId, programTitle }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
        
      if (error) throw error;
      setUsers(data || []);
      
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const assignProgram = async () => {
    try {
      if (!selectedUserId) {
        toast.error("Please select a user");
        return;
      }
      
      const { error } = await supabase
        .from('user_program_assignments')
        .upsert({
          user_id: selectedUserId,
          program_id: programId,
          start_date: startDate || null,
          end_date: endDate || null
        });
        
      if (error) throw error;
      
      toast.success(`Program assigned successfully`);
      
    } catch (error) {
      console.error("Error assigning program:", error);
      toast.error("Failed to assign program");
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="user-select">Select User</Label>
        <select
          id="user-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="start-date">Start Date (Optional)</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="end-date">End Date (Optional)</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      
      <Button className="w-full" onClick={assignProgram}>
        Assign "{programTitle}" to User
      </Button>
    </div>
  );
};

export default ProgramCreator;
