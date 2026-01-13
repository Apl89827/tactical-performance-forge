import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingAction {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

const PENDING_ACTIONS_KEY = 'pf_pending_actions';
const OFFLINE_DATA_KEY = 'pf_offline_data';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Load pending actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing data...");
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Changes will sync when connected.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue an action for later sync
  const queueAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setPendingActions(prev => [...prev, newAction]);
    return newAction.id;
  }, []);

  // Sync pending actions when online
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const successfulIds: string[] = [];
    const failedActions: PendingAction[] = [];

    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'insert':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase.from(action.table as any).insert(action.data as any);
            break;
          case 'update':
            const { id, ...updateData } = action.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase.from(action.table as any).update(updateData).eq('id', id as string);
            break;
          case 'delete':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase.from(action.table as any).delete().eq('id', action.data.id as string);
            break;
        }
        successfulIds.push(action.id);
      } catch (error) {
        console.error('Sync failed for action:', action, error);
        failedActions.push(action);
      }
    }

    setPendingActions(failedActions);
    setIsSyncing(false);

    if (successfulIds.length > 0) {
      toast.success(`Synced ${successfulIds.length} changes`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    }

    if (failedActions.length > 0) {
      toast.error(`${failedActions.length} changes failed to sync`);
    }
  }, [isOnline, pendingActions, isSyncing, queryClient]);

  // Cache data for offline use
  const cacheData = useCallback((key: string, data: unknown) => {
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '{}');
      offlineData[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(<T,>(key: string): T | null => {
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '{}');
      return offlineData[key]?.data || null;
    } catch {
      return null;
    }
  }, []);

  // Clear old cached data (older than 7 days)
  const clearOldCache = useCallback(() => {
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '{}');
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const cleaned = Object.fromEntries(
        Object.entries(offlineData).filter(
          ([, value]) => (value as { timestamp: number }).timestamp > sevenDaysAgo
        )
      );
      
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cleaned));
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingActionsCount: pendingActions.length,
    queueAction,
    syncPendingActions,
    cacheData,
    getCachedData,
    clearOldCache
  };
};
