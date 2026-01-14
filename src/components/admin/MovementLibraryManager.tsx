import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Video, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { VideoUploader } from "./VideoUploader";

interface Movement {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  video_url: string | null;
  difficulty_level: string | null;
  is_bodyweight: boolean;
  equipment_needed: string[] | null;
  exercise_type: string; // "strength" | "cardio" | "plyometric" | "mobility"
}

export const MovementLibraryManager = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Movement>>({
    name: "",
    category: "accessory",
    subcategory: null,
    description: "",
    video_url: "",
    difficulty_level: "intermediate",
    is_bodyweight: false,
    equipment_needed: [],
    exercise_type: "strength",
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from("movement_library")
        .select("*")
        .order("name");

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast.error("Failed to load movement library");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.category) {
        toast.error("Name and category are required");
        return;
      }

      if (editingMovement) {
        const { error } = await supabase
          .from("movement_library")
          .update(formData)
          .eq("id", editingMovement.id);

        if (error) throw error;
        toast.success("Movement updated successfully");
      } else {
        const { error } = await supabase
          .from("movement_library")
          .insert([{
            name: formData.name!,
            category: formData.category!,
            subcategory: formData.subcategory || null,
            description: formData.description || null,
            video_url: formData.video_url || null,
            difficulty_level: formData.difficulty_level || null,
            is_bodyweight: formData.is_bodyweight || false,
            equipment_needed: formData.equipment_needed || null,
            exercise_type: formData.exercise_type || "strength",
          }]);

        if (error) throw error;
        toast.success("Movement created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMovements();
    } catch (error) {
      console.error("Error saving movement:", error);
      toast.error("Failed to save movement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this movement?")) return;

    try {
      const { error } = await supabase
        .from("movement_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Movement deleted successfully");
      fetchMovements();
    } catch (error) {
      console.error("Error deleting movement:", error);
      toast.error("Failed to delete movement");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "accessory",
      subcategory: null,
      description: "",
      video_url: "",
      difficulty_level: "intermediate",
      is_bodyweight: false,
      equipment_needed: [],
      exercise_type: "strength",
    });
    setEditingMovement(null);
  };

  const openEditDialog = (movement: Movement) => {
    setEditingMovement(movement);
    setFormData(movement);
    setIsDialogOpen(true);
  };

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = movement.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || movement.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="p-4">Loading movement library...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Movement Library</h2>
          <p className="text-muted-foreground">Manage exercise database with videos and form cues</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMovement ? "Edit" : "Add"} Movement</DialogTitle>
              <DialogDescription>
                {editingMovement ? "Update" : "Create"} an exercise in the movement library
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Barbell Back Squat"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Exercise Type *</Label>
                  <Select
                    value={formData.exercise_type || "strength"}
                    onValueChange={(value: "strength" | "cardio" | "plyometric" | "mobility") => setFormData({ ...formData, exercise_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="plyometric">Plyometric</SelectItem>
                      <SelectItem value="mobility">Mobility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="max_effort">Max Effort</SelectItem>
                      <SelectItem value="dynamic_effort">Dynamic Effort</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="gpp">GPP</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={formData.subcategory || ""}
                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upper_push">Upper Push</SelectItem>
                      <SelectItem value="upper_pull">Upper Pull</SelectItem>
                      <SelectItem value="squat">Squat</SelectItem>
                      <SelectItem value="deadlift">Deadlift</SelectItem>
                      <SelectItem value="posterior_chain">Posterior Chain</SelectItem>
                      <SelectItem value="trunk">Trunk</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="rucking">Rucking</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="rowing">Rowing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the movement..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Form Video</Label>
                <VideoUploader
                  currentVideoUrl={formData.video_url || null}
                  onVideoUrlChange={(url) => setFormData({ ...formData, video_url: url })}
                  movementName={formData.name}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty_level || "intermediate"}
                    onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="bodyweight"
                    checked={formData.is_bodyweight}
                    onChange={(e) => setFormData({ ...formData, is_bodyweight: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="bodyweight">Bodyweight Exercise</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingMovement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search movements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="max_effort">Max Effort</SelectItem>
            <SelectItem value="dynamic_effort">Dynamic Effort</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
            <SelectItem value="gpp">GPP</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMovements.map((movement) => (
          <Card key={movement.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{movement.name}</CardTitle>
                  <CardDescription>{movement.subcategory}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {movement.video_url && (
                    <Button variant="ghost" size="icon" asChild className="text-primary">
                      <a href={movement.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(movement)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(movement.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={movement.exercise_type === "cardio" ? "default" : "secondary"}>
                  {movement.exercise_type === "cardio" ? "🏃 Cardio" : movement.category}
                </Badge>
                <Badge variant="outline">{movement.difficulty_level}</Badge>
                {movement.is_bodyweight && <Badge>Bodyweight</Badge>}
              </div>
              {movement.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {movement.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No movements found. Try adjusting your filters or add a new movement.
          </CardContent>
        </Card>
      )}
    </div>
  );
};