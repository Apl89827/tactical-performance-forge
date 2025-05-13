
import React, { useState } from "react";
import { Edit, Clock, Play, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
}

interface EditableWorkoutProps {
  workout: {
    id: string;
    title: string;
    description: string;
    exercises: WorkoutExercise[];
    duration: number;
  };
  isAdmin: boolean;
  onWorkoutUpdated: (workout: any) => void;
}

const EditableWorkout: React.FC<EditableWorkoutProps> = ({
  workout,
  isAdmin,
  onWorkoutUpdated
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState({ ...workout });

  const handleExerciseChange = (index: number, field: string, value: any) => {
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[index] = { 
      ...updatedExercises[index], 
      [field]: field === 'sets' ? parseInt(value, 10) || 0 : value 
    };
    
    setEditedWorkout({
      ...editedWorkout,
      exercises: updatedExercises
    });
  };

  const addExercise = () => {
    setEditedWorkout({
      ...editedWorkout,
      exercises: [
        ...editedWorkout.exercises,
        { name: "New Exercise", sets: 3, reps: "10" }
      ]
    });
  };

  const removeExercise = (index: number) => {
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises.splice(index, 1);
    
    setEditedWorkout({
      ...editedWorkout,
      exercises: updatedExercises
    });
  };

  const handleSave = async () => {
    try {
      // Save to database (in a real app)
      // For now, just update the state through the callback
      onWorkoutUpdated(editedWorkout);
      
      toast.success("Workout updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to update workout");
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedWorkout({ ...workout });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="workout-card relative">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Title</label>
            <input
              type="text"
              value={editedWorkout.title}
              onChange={(e) => setEditedWorkout({ ...editedWorkout, title: e.target.value })}
              className="w-full p-2 bg-background border border-border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <textarea
              value={editedWorkout.description}
              onChange={(e) => setEditedWorkout({ ...editedWorkout, description: e.target.value })}
              className="w-full p-2 bg-background border border-border rounded"
              rows={2}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={editedWorkout.duration}
              onChange={(e) => setEditedWorkout({ ...editedWorkout, duration: parseInt(e.target.value, 10) || 0 })}
              className="w-full p-2 bg-background border border-border rounded"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-muted-foreground">Exercises</label>
              <button 
                onClick={addExercise}
                className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground"
              >
                + Add Exercise
              </button>
            </div>
            
            <div className="space-y-3">
              {editedWorkout.exercises.map((exercise, index) => (
                <div key={index} className="flex flex-col border border-border p-2 rounded bg-card/50">
                  <div className="flex justify-between items-center mb-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                      className="flex-1 p-1 bg-transparent border-b border-muted"
                    />
                    <button 
                      onClick={() => removeExercise(index)}
                      className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded ml-2"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Sets</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                        className="w-full p-1 bg-transparent border-b border-muted"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                        className="w-full p-1 bg-transparent border-b border-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button 
            onClick={handleCancel}
            className="px-3 py-1 border border-border rounded text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-3 py-1 bg-tactical-blue text-white rounded text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-card relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xl">{workout.title}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock size={14} className="mr-1" />
          <span>{workout.duration} min</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
      
      <div className="space-y-2 mb-4">
        {workout.exercises.map((exercise, index) => (
          <div key={index} className="flex justify-between py-1 border-b border-border/50 last:border-0">
            <span>{exercise.name}</span>
            <span className="text-muted-foreground">{exercise.sets} × {exercise.reps}</span>
          </div>
        ))}
      </div>
      
      <button 
        className="btn-primary"
        onClick={() => navigate(`/workout/${workout.id}`)}
      >
        <Play size={18} className="mr-2" />
        Start Workout
      </button>
      
      {isAdmin && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 p-1 bg-card rounded-full border border-border hover:bg-muted"
        >
          <Edit size={14} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default EditableWorkout;
