import { WifiOff, RefreshCw, Cloud, Check } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingActionsCount, syncPendingActions } = useOfflineSync();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOnline && !isSyncing && pendingActionsCount === 0 && lastSyncTime) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing, pendingActionsCount, lastSyncTime]);

  const handleSync = async () => {
    await syncPendingActions();
    setLastSyncTime(new Date());
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Success indicator (briefly shows after sync)
  if (showSuccess) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
        <div className="bg-green-500/90 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Check className="w-4 h-4" />
          <span>All changes synced</span>
        </div>
      </div>
    );
  }

  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>You're offline</span>
          {lastSyncTime && (
            <span className="text-amber-950/70 text-xs ml-1">
              • Last sync: {formatLastSync()}
            </span>
          )}
        </div>
      )}
      
      {isOnline && pendingActionsCount > 0 && (
        <div className="bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down">
          <Cloud className="w-4 h-4" />
          <span>{pendingActionsCount} pending {pendingActionsCount === 1 ? 'change' : 'changes'}</span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-primary-foreground hover:bg-white/20 ml-1"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
