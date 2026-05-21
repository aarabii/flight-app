"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiDownloadCloud2Line, RiCloseLine } from "@remixicon/react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Clear any legacy dismissed flag so the new behavior applies immediately on reload
    if (typeof window !== "undefined") {
      localStorage.removeItem("flygo-pwa-dismissed");
    }

    // Check if app is running in standalone mode (already installed)
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean })
          ?.standalone ||
        (typeof document !== "undefined" &&
          document.referrer &&
          document.referrer.includes("android-app://")));

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Set iOS state
    const userAgent =
      typeof window !== "undefined" ? window.navigator.userAgent : "";
    const ios =
      /iPad|iPhone|iPod/.test(userAgent) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(ios);

    // Make it visible immediately on mount (so as soon as someone lands, it appears!)
    setIsVisible(true);

    // Listen for beforeinstallprompt event to capture deferredPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Store globally for other components to access
      if (typeof window !== "undefined") {
        (
          window as Window & {
            deferredAppInstallPrompt?: BeforeInstallPromptEvent | null;
          }
        ).deferredAppInstallPrompt = promptEvent;
        window.dispatchEvent(
          new CustomEvent("pwa-prompt-available", { detail: promptEvent }),
        );
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsDismissed(true);
        }
      } catch (err) {
        console.error("PWA prompt error:", err);
      }
    } else {
      // No native prompt available (Safari, Firefox, etc.) or not fired yet
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!mounted || !isVisible || isDismissed) return null;

  if (showInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md md:w-full z-50 animate-bounce-in">
        <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold tracking-tight">
              How to Install FlyGo
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInstructions(false)}
              className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer animate-fade-in"
            >
              <RiCloseLine className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
            {isIOS ? (
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Tap the <strong>Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            ) : (
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Click the browser menu (<strong>⋮</strong> or{" "}
                  <strong>⋯</strong>) at the top-right.
                </li>
                <li>
                  Select <strong>Install app</strong> or{" "}
                  <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md md:w-full z-50 animate-bounce-in">
      <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Image
              src="/icons/icon-192x192.png"
              alt="FlyGo Icon"
              width={28}
              height={28}
              className="h-7 w-7 object-contain rounded animate-pulse"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold tracking-tight">
              Install FlyGo App
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add to your home screen for offline access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="font-semibold text-xs py-1.5 px-3 shadow shadow-primary/15 cursor-pointer hover:scale-105 transition-transform"
          >
            <RiDownloadCloud2Line className="mr-1 h-3.5 w-3.5" />
            Install
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <RiCloseLine className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
