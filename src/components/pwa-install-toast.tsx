"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiCloseLine } from "@remixicon/react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallToast() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Clear legacy dismissal storage if any, to guarantee it pops up on every landing
    if (typeof window !== "undefined") {
      localStorage.removeItem("flygo-pwa-toast-dismissed");
    }

    // Check if app is running in standalone mode (already installed)
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean })
          ?.standalone ||
        (document.referrer && document.referrer.includes("android-app://")));

    if (isStandalone) {
      return;
    }

    // Set iOS state
    const userAgent =
      typeof window !== "undefined" ? window.navigator.userAgent : "";
    const ios =
      /iPad|iPhone|iPod/.test(userAgent) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(ios);

    // Capture standard beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Save globally
      if (typeof window !== "undefined") {
        (
          window as Window & {
            deferredAppInstallPrompt?: BeforeInstallPromptEvent | null;
          }
        ).deferredAppInstallPrompt = promptEvent;
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Trigger normal sonner toast on landing
    const triggerToast = () => {
      // Dismiss any existing toast with this ID to prevent stacking
      toast.dismiss("pwa-install");

      toast("Install FlyGo Airlines", {
        id: "pwa-install",
        description:
          "Add FlyGo to your home screen or desktop for a fast, premium, app-like booking experience.",
        duration: 30000, // Show for 30s
        action: {
          label: "Install",
          onClick: async () => {
            // Retrieve latest prompt
            const currentPrompt =
              deferredPrompt ||
              (typeof window !== "undefined"
                ? (
                    window as Window & {
                      deferredAppInstallPrompt?: BeforeInstallPromptEvent | null;
                    }
                  ).deferredAppInstallPrompt
                : null);

            if (currentPrompt) {
              try {
                await currentPrompt.prompt();
                const choiceResult = await currentPrompt.userChoice;
                if (choiceResult.outcome === "accepted") {
                  // User accepted, prompt is done
                }
              } catch (err) {
                console.error("PWA prompt error:", err);
              }
            } else {
              // Show our sleek instructions overlay since native prompt isn't supported/available
              setShowInstructions(true);
            }
          },
        },
      });
    };

    // Trigger toast after a 1 second delay to ensure layout is mounted and toaster is ready
    const timer = setTimeout(triggerToast, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, [deferredPrompt]);

  if (!mounted) return null;

  if (showInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md md:w-full z-[100] animate-bounce-in">
        <Card className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              How to Install FlyGo
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInstructions(false)}
              className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
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

  return null;
}
