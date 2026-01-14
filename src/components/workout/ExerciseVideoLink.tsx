import React, { useState, useEffect } from "react";
import { Play, ExternalLink, Search } from "lucide-react";

interface ExerciseVideoLinkProps {
  exerciseName: string;
  videoUrl?: string | null;
}

/**
 * Generates a YouTube search URL for an exercise
 */
const generateYouTubeSearchUrl = (exerciseName: string): string => {
  // Clean up exercise name for better search results
  const cleanName = exerciseName
    .replace(/^ex_/, "") // Remove ex_ prefix
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
  
  const searchQuery = encodeURIComponent(`${cleanName} exercise form tutorial`);
  return `https://www.youtube.com/results?search_query=${searchQuery}`;
};

/**
 * Extracts YouTube video ID from various URL formats
 */
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const ExerciseVideoLink: React.FC<ExerciseVideoLinkProps> = ({
  exerciseName,
  videoUrl,
}) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (videoUrl) {
      const id = extractYouTubeId(videoUrl);
      setVideoId(id);
    } else {
      setVideoId(null);
    }
  }, [videoUrl]);

  const displayName = exerciseName.replace(/^ex_/, "").replace(/_/g, " ");
  const searchUrl = generateYouTubeSearchUrl(exerciseName);

  // If we have a direct video URL with valid YouTube ID
  if (videoId && showEmbed) {
    return (
      <div className="relative aspect-video rounded-md overflow-hidden bg-secondary mb-4">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={`${displayName} demonstration`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
        <button
          onClick={() => setShowEmbed(false)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
          aria-label="Close video"
        >
          <span className="text-sm">✕</span>
        </button>
      </div>
    );
  }

  // If we have a direct video URL, show thumbnail with play button
  if (videoId) {
    return (
      <button
        onClick={() => setShowEmbed(true)}
        className="relative aspect-video w-full rounded-md overflow-hidden bg-secondary mb-4 group cursor-pointer"
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={`${displayName} thumbnail`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/40 group-hover:bg-background/30 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
          Watch demo
        </span>
      </button>
    );
  }

  // Fallback: YouTube search link
  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="aspect-video bg-primary/10 mb-4 rounded-md flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors group"
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <Search size={28} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <Play size={14} className="text-primary absolute -bottom-1 -right-1" />
        </div>
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Search YouTube for demo
        </span>
        <span className="text-xs text-muted-foreground/70 flex items-center mt-1">
          <ExternalLink size={10} className="mr-1" />
          Opens in new tab
        </span>
      </div>
    </a>
  );
};

export default ExerciseVideoLink;
