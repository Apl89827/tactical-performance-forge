import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  children, 
  onRefresh,
  disabled = false 
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance to pull
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);
      
      // Haptic feedback when threshold is crossed
      if (distance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        triggerHaptic("light");
      }
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic("medium");
      
      try {
        await onRefresh();
        triggerHaptic("success");
      } catch (error) {
        console.error("Refresh failed:", error);
        triggerHaptic("error");
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, isRefreshing, onRefresh, triggerHaptic]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center z-10 transition-opacity duration-200"
        style={{ 
          top: Math.min(pullDistance - 40, 20),
          opacity: pullDistance > 10 ? 1 : 0 
        }}
      >
        <div 
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200
            ${shouldTrigger ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
            ${isRefreshing ? 'animate-pulse' : ''}
          `}
          style={{
            transform: `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide touch-pan-y"
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
