import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection" | "impact";

/**
 * Hook for triggering haptic feedback on supported devices
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticType = "medium") => {
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
        case "selection":
          // Very light tap for selections/navigation
          navigator.vibrate(5);
          break;
        case "impact":
          // Strong single tap for impacts
          navigator.vibrate(40);
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

  const buttonPress = useCallback(() => {
    triggerHaptic("light");
  }, [triggerHaptic]);

  const tabChange = useCallback(() => {
    triggerHaptic("selection");
  }, [triggerHaptic]);

  const formSubmit = useCallback(() => {
    triggerHaptic("medium");
  }, [triggerHaptic]);

  const pullToRefresh = useCallback(() => {
    triggerHaptic("impact");
  }, [triggerHaptic]);

  return { 
    triggerHaptic, 
    timerComplete,
    buttonPress,
    tabChange,
    formSubmit,
    pullToRefresh
  };
};
