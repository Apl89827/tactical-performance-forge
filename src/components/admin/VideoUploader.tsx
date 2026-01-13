import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, Video, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoUploaderProps {
  currentVideoUrl: string | null;
  onVideoUrlChange: (url: string | null) => void;
  movementName?: string;
}

export const VideoUploader = ({ currentVideoUrl, onVideoUrlChange, movementName }: VideoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [externalUrl, setExternalUrl] = useState(currentVideoUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload MP4, WebM, or MOV files only");
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast.error("File size must be under 50MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = movementName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'video';
      const extension = file.name.split('.').pop();
      const fileName = `${sanitizedName}-${timestamp}.${extension}`;

      // Simulate progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('exercise-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      onVideoUrlChange(publicUrl);
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExternalUrl = () => {
    if (!externalUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(externalUrl);
      onVideoUrlChange(externalUrl);
      toast.success("Video URL saved!");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleRemoveVideo = async () => {
    if (!currentVideoUrl) return;

    // If it's a Supabase storage URL, delete the file
    if (currentVideoUrl.includes('exercise-videos')) {
      try {
        const path = currentVideoUrl.split('exercise-videos/')[1];
        if (path) {
          await supabase.storage.from('exercise-videos').remove([path]);
        }
      } catch (error) {
        console.error("Error deleting video:", error);
      }
    }

    onVideoUrlChange(null);
    setExternalUrl("");
    toast.success("Video removed");
  };

  return (
    <div className="space-y-4">
      {currentVideoUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            <video 
              src={currentVideoUrl} 
              controls 
              className="w-full h-full object-contain"
              preload="metadata"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {currentVideoUrl.split('/').pop()}
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRemoveVideo}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="h-4 w-4 mr-2" />
              External URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload a video</p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM, or MOV • Max 50MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
              <Button onClick={handleExternalUrl}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a YouTube, Vimeo, or direct video URL
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
