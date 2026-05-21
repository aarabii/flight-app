"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiDownloadCloud2Line, RiCloseLine } from "@remixicon/react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check if user has already dismissed it
    const isDismissed = typeof window !== "undefined" && localStorage.getItem("flygo-pwa-dismissed") === "true";
    if (isDismissed) return;

    // Check if app is running in standalone mode (already installed)
    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")
    );
    if (isStandalone) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Store globally for other components to access (e.g. desktop landing page toast)
      if (typeof window !== "undefined") {
        (window as any).deferredAppInstallPrompt = promptEvent;
        window.dispatchEvent(new CustomEvent("pwa-prompt-available", { detail: promptEvent }));
      }
      
      // Show only on mobile screens (less than 768px wide)
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also double check resize/layout just in case
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isDismissedCheck = localStorage.getItem("flygo-pwa-dismissed") === "true";
      const isStandaloneCheck = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
      if (deferredPrompt && isMobile && !isDismissedCheck && !isStandaloneCheck) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("resize", handleResize);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show prompt
    await deferredPrompt.prompt();
    
    // Wait for choice
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      localStorage.setItem("flygo-pwa-dismissed", "true");
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("flygo-pwa-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-bounce-in md:hidden">
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <img 
              src="/icons/icon-192x192.png" 
              alt="FlyGo Icon" 
              className="h-7 w-7 object-contain rounded" 
              onError={(e) => {
                // fallback if icon not found
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold tracking-tight">Install FlyGo App</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Add to your home screen for offline access</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleInstallClick} className="font-semibold text-xs py-1.5 px-3 shadow shadow-primary/15 cursor-pointer">
            <RiDownloadCloud2Line className="mr-1 h-3.5 w-3.5" />
            Install
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <RiCloseLine className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
