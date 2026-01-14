import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_COUNT_KEY = "pwa_visit_count";
const DISMISSED_KEY = "pwa_banner_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_VISITS_TO_SHOW = 3;

const SmartInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Increment visit count
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, visitCount.toString());

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // Still in dismiss period
      }
      localStorage.removeItem(DISMISSED_KEY);
    }

    // Show banner after minimum visits
    if (visitCount >= MIN_VISITS_TO_SHOW) {
      setShouldShow(true);
    }

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShouldShow(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    triggerHaptic("medium");
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        triggerHaptic("success");
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShouldShow(false);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShouldShow(false);
    setShowIOSInstructions(false);
  };

  if (isInstalled || !shouldShow) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Install PF Operator
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to home screen for quick access & offline workouts
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1 h-8 text-xs"
                >
                  {isIOS ? "How to Install" : "Install Now"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          <div className="relative bg-card border-t border-border rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-slide-up">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Install on iPhone/iPad
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Tap the <Share className="w-4 h-4 inline mx-1" /> share button in Safari
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Scroll down and tap <Plus className="w-4 h-4 inline mx-1" /> "Add to Home Screen"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Tap "Add" in the top right corner
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6" 
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartInstallBanner;
