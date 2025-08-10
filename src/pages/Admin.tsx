import React, { useState, useEffect } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Image, 
  ArrowLeft, 
  Check, 
  X 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleManager from "@/components/admin/RoleManager";

interface Content {
  id: string;
  title: string;
  content: string;
  content_type: string;
  image_url: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    content_type: "workout",
    image_url: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if the user is an admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }
        
        // Check if the user is an admin
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
          
        if (rolesError) throw rolesError;
        
        if (!roles || roles.length === 0) {
          // User is not an admin
          toast.error("You don't have permission to access this page");
          navigate("/dashboard");
          return;
        }
        
        setIsAdmin(true);
        fetchContents();
      } catch (error) {
        console.error("Error checking admin:", error);
        toast.error("Error checking permissions");
        navigate("/dashboard");
      }
    }
    
    checkAdmin();
  }, [navigate]);
  
  // Fetch content
  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Error loading content");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  // Upload image to storage
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };
  
  // Save content (add or edit)
  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }
      
      let imageUrl = formData.image_url;
      
      // Upload image if a new file was selected
      if (file) {
        imageUrl = await uploadImage(file);
      }
      
      if (isEditingContent) {
        // Update existing content
        const { error } = await supabase
          .from('content')
          .update({
            title: formData.title,
            content: formData.content,
            content_type: formData.content_type,
            image_url: imageUrl
          })
          .eq('id', isEditingContent);
          
        if (error) throw error;
        
        toast.success("Content updated successfully");
      } else {
        // Create new content
        const { error } = await supabase
          .from('content')
          .insert({
            title: formData.title,
            content: formData.content,
            content_type: formData.content_type,
            image_url: imageUrl,
            created_by: user.id
          });
          
        if (error) throw error;
        
        toast.success("Content added successfully");
      }
      
      // Clear form and reset state
      setFormData({
        title: "",
        content: "",
        content_type: "workout",
        image_url: ""
      });
      setFile(null);
      setIsAddingContent(false);
      setIsEditingContent(null);
      
      // Refresh content list
      fetchContents();
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Error saving content");
    } finally {
      setLoading(false);
    }
  };
  
  // Delete content
  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Content deleted successfully");
      fetchContents();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Error deleting content");
    }
  };
  
  // Edit content
  const editContent = (content: Content) => {
    setFormData({
      title: content.title,
      content: content.content,
      content_type: content.content_type,
      image_url: content.image_url || ""
    });
    setIsEditingContent(content.id);
    setIsAddingContent(true);
  };
  
  // Cancel adding/editing content
  const cancelAddEdit = () => {
    setIsAddingContent(false);
    setIsEditingContent(null);
    setFormData({
      title: "",
      content: "",
      content_type: "workout",
      image_url: ""
    });
    setFile(null);
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <MobileLayout title={isAddingContent ? (isEditingContent ? "Edit Content" : "Add Content") : "Admin"}>
      <div className="mobile-safe-area">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            {!isAddingContent ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">All Content</h2>
                  <button
                    onClick={() => setIsAddingContent(true)}
                    className="btn-primary py-1 px-2 h-9 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
                  </div>
                ) : contents.length === 0 ? (
                  <div className="text-center py-8 bg-card border border-border rounded-lg">
                    <p className="text-muted-foreground">No content found. Add your first content item!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contents.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell className="font-medium">{content.title}</TableCell>
                            <TableCell>{content.content_type}</TableCell>
                            <TableCell>
                              {content.image_url ? (
                                <img
                                  src={content.image_url}
                                  alt={content.title}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => editContent(content)}
                                className="p-1 text-blue-500 hover:text-blue-700 mr-2"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteContent(content.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <div>
                <button 
                  onClick={cancelAddEdit}
                  className="flex items-center text-sm mb-4"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back to content list
                </button>
                
                <form onSubmit={saveContent} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="content_type" className="block text-sm font-medium">
                      Content Type
                    </label>
                    <select
                      id="content_type"
                      name="content_type"
                      value={formData.content_type}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="workout">Workout</option>
                      <option value="article">Article</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium">
                      Content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      className="input-field min-h-[150px]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Image
                    </label>
                    {formData.image_url && (
                      <div className="mb-2">
                        <img
                          src={formData.image_url}
                          alt="Content preview"
                          className="h-32 w-auto object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex items-center">
                      <label 
                        htmlFor="image"
                        className="cursor-pointer flex items-center bg-secondary px-4 py-2 rounded hover:bg-secondary/80"
                      >
                        <Image size={16} className="mr-2" />
                        {file ? file.name : "Choose Image"}
                      </label>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {file && (
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={cancelAddEdit}
                      className="btn-outline"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        <>
                          <Check size={16} className="mr-1" />
                          {isEditingContent ? "Update" : "Save"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles">
            <RoleManager />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Admin;
