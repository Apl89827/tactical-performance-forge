import { WifiOff, Dumbbell, ClipboardList, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const OfflineFallback = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 animate-pulse">
        <WifiOff className="w-10 h-10 text-amber-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">
        You're Offline
      </h1>
      
      <p className="text-muted-foreground mb-8 max-w-xs">
        No internet connection. Some features are still available offline.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <h2 className="text-sm font-medium text-foreground text-left mb-3">
          Available offline:
        </h2>
        
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Cached Workouts</p>
            <p className="text-xs text-muted-foreground">View recently opened workouts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Log Workouts</p>
            <p className="text-xs text-muted-foreground">Your progress syncs when back online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Profile Info</p>
            <p className="text-xs text-muted-foreground">View your cached profile data</p>
          </div>
        </div>
      </div>

      <Button onClick={handleRetry} className="w-full max-w-sm">
        Try Again
      </Button>
      
      <p className="text-xs text-muted-foreground mt-4">
        Changes made offline will sync automatically
      </p>
    </div>
  );
};

export default OfflineFallback;
