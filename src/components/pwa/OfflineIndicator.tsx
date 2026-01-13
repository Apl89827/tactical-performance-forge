import { WifiOff, RefreshCw, Cloud } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";

const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingActionsCount, syncPendingActions } = useOfflineSync();

  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline - changes will sync when connected</span>
        </div>
      )}
      
      {isOnline && pendingActionsCount > 0 && (
        <div className="bg-blue-500/90 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Cloud className="w-4 h-4" />
          <span>{pendingActionsCount} pending changes</span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-white hover:bg-white/20"
            onClick={syncPendingActions}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
