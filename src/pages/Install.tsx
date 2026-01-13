import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, Plus } from "lucide-react";
import MobileLayout from "@/components/layouts/MobileLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <MobileLayout title="Install App">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">App Installed!</h2>
          <p className="text-muted-foreground text-center">
            Performance First Operator is installed on your device.
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Install App">
      <div className="p-4 space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Install PF Operator
          </h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {/* Benefits */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Why Install?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Works Offline</p>
                <p className="text-sm text-muted-foreground">
                  Access your workouts even without internet
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Quick Access</p>
                <p className="text-sm text-muted-foreground">
                  Launch from your home screen instantly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Full Screen</p>
                <p className="text-sm text-muted-foreground">
                  Immersive experience without browser UI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Button or Instructions */}
        {deferredPrompt ? (
          <Button 
            onClick={handleInstall} 
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Install App
          </Button>
        ) : isIOS ? (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share className="w-5 h-5" />
                Install on iOS
              </CardTitle>
              <CardDescription>
                Follow these steps to install:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <p className="text-foreground">
                  Tap the <Share className="w-4 h-4 inline" /> Share button
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <p className="text-foreground">
                  Scroll and tap "Add to Home Screen" <Plus className="w-4 h-4 inline" />
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <p className="text-foreground">
                  Tap "Add" to confirm
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Open this page in Chrome or Safari to install the app
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};

export default Install;
