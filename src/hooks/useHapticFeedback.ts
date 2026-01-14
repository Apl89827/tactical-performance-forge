import { useCallback } from "react";

/**
 * Hook for triggering haptic feedback on supported devices
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "medium") => {
    // Check if vibration API is supported
    if (!("vibrate" in navigator)) return;

    try {
      switch (type) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(25);
          break;
        case "heavy":
          navigator.vibrate(50);
          break;
        case "success":
          // Double tap pattern for success
          navigator.vibrate([15, 50, 15]);
          break;
        case "warning":
          // Triple short taps for warning
          navigator.vibrate([10, 30, 10, 30, 10]);
          break;
        case "error":
          // Long buzz for error
          navigator.vibrate(100);
          break;
        default:
          navigator.vibrate(25);
      }
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug("Haptic feedback not available:", error);
    }
  }, []);

  const timerComplete = useCallback(() => {
    // Strong pattern for timer completion
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([100, 100, 100, 100, 200]);
      } catch (error) {
        console.debug("Haptic feedback not available:", error);
      }
    }
  }, []);

  return { triggerHaptic, timerComplete };
};
