
import React, { useState } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { Search, Filter, Play } from "lucide-react";

const Library = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Mock exercise data
  const exercises = [
    {
      id: 1,
      name: "Back Squat",
      category: "lower-body",
      equipment: "barbell",
      tags: ["strength", "legs", "compound"],
      thumbnail: "back-squat",
    },
    {
      id: 2,
      name: "Bench Press",
      category: "upper-body",
      equipment: "barbell",
      tags: ["strength", "chest", "compound"],
      thumbnail: "bench-press",
    },
    {
      id: 3,
      name: "Deadlift",
      category: "lower-body",
      equipment: "barbell",
      tags: ["strength", "legs", "back", "compound"],
      thumbnail: "deadlift",
    },
    {
      id: 4,
      name: "Pull-up",
      category: "upper-body",
      equipment: "bodyweight",
      tags: ["strength", "back", "arms", "compound"],
      thumbnail: "pull-up",
    },
    {
      id: 5,
      name: "Push-up",
      category: "upper-body",
      equipment: "bodyweight",
      tags: ["strength", "chest", "compound"],
      thumbnail: "push-up",
    },
    {
      id: 6,
      name: "Kettlebell Swing",
      category: "full-body",
      equipment: "kettlebell",
      tags: ["power", "conditioning", "compound"],
      thumbnail: "kb-swing",
    },
    {
      id: 7,
      name: "Romanian Deadlift",
      category: "lower-body",
      equipment: "barbell",
      tags: ["strength", "legs", "compound"],
      thumbnail: "rdl",
    },
    {
      id: 8,
      name: "Military Press",
      category: "upper-body",
      equipment: "barbell",
      tags: ["strength", "shoulders", "compound"],
      thumbnail: "military-press",
    },
    {
      id: 9,
      name: "Dumbbell Row",
      category: "upper-body",
      equipment: "dumbbell",
      tags: ["strength", "back", "isolation"],
      thumbnail: "db-row",
    },
    {
      id: 10,
      name: "Burpee",
      category: "full-body",
      equipment: "bodyweight",
      tags: ["conditioning", "cardio", "compound"],
      thumbnail: "burpee",
    },
    {
      id: 11,
      name: "Sandbag Carry",
      category: "full-body",
      equipment: "sandbag",
      tags: ["strength", "conditioning", "functional"],
      thumbnail: "sandbag-carry",
    },
    {
      id: 12,
      name: "Ruck March",
      category: "full-body",
      equipment: "rucksack",
      tags: ["endurance", "conditioning", "functional"],
      thumbnail: "ruck-march",
    },
  ];
  
  const filters = [
    { id: "all", label: "All" },
    { id: "upper-body", label: "Upper Body" },
    { id: "lower-body", label: "Lower Body" },
    { id: "full-body", label: "Full Body" },
    { id: "conditioning", label: "Conditioning" },
  ];
  
  const filteredExercises = exercises.filter(exercise => {
    // Apply search filter
    const matchesSearch = searchQuery === "" || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = activeFilter === "all" || 
      (activeFilter === "conditioning" && exercise.tags.includes("conditioning")) ||
      exercise.category === activeFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <MobileLayout title="Exercise Library">
      <div className="mobile-safe-area py-4">
        {/* Search bar */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Filters */}
        <div className="flex overflow-x-auto py-2 space-x-2 mb-4 hide-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                activeFilter === filter.id
                  ? "bg-tactical-blue text-white"
                  : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredExercises.length} exercises found
          </span>
          <button className="flex items-center text-sm text-muted-foreground">
            <Filter size={16} className="mr-1" />
            More Filters
          </button>
        </div>
        
        {/* Exercise grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-tactical-blue/10 flex items-center justify-center">
                {/* This would be an image in a real app */}
                <div className="text-tactical-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 4 3 3-3 3"></path>
                    <path d="m18 20 3-3-3-3"></path>
                    <path d="M3 7h3a5 5 0 0 1 5 5 5 5 0 0 0 5 5h5"></path>
                    <path d="M3 17h3a5 5 0 0 0 5-5 5 5 0 0 1 5-5h5"></path>
                  </svg>
                </div>
                <button className="absolute bottom-2 right-2 bg-tactical-blue rounded-full p-1.5">
                  <Play size={14} className="text-white" fill="white" />
                </button>
              </div>
              
              {/* Exercise info */}
              <div className="p-2">
                <h3 className="font-medium text-sm">{exercise.name}</h3>
                <div className="flex flex-wrap mt-1">
                  <span className="text-xs bg-secondary py-0.5 px-1.5 rounded mr-1 mb-1 text-muted-foreground">
                    {exercise.equipment}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No exercises found matching your criteria.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Library;
