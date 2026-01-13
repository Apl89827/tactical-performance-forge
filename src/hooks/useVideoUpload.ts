import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadOptions {
  bucket: 'exercise-videos' | 'progress-photos';
  folder?: string;
  maxSize?: number;
}

export const useVideoUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (
    file: File, 
    options: UploadOptions
  ): Promise<string | null> => {
    const { bucket, folder, maxSize = 52428800 } = options;

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be under ${Math.round(maxSize / 1048576)}MB`);
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const sanitizedName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const fileName = folder 
        ? `${folder}/${sanitizedName}-${timestamp}.${extension}`
        : `${sanitizedName}-${timestamp}.${extension}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL for public buckets
      if (bucket === 'exercise-videos') {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        setProgress(100);
        return publicUrl;
      }

      // For private buckets, return the path
      setProgress(100);
      return data.path;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const remove = async (url: string, bucket: string): Promise<boolean> => {
    try {
      const path = url.split(`${bucket}/`)[1];
      if (!path) return false;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };

  const getSignedUrl = async (
    path: string, 
    bucket: string, 
    expiresIn = 3600
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Signed URL error:", error);
      return null;
    }
  };

  return {
    upload,
    remove,
    getSignedUrl,
    isUploading,
    progress
  };
};
