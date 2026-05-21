"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallToast() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    // Check if user has already dismissed it
    const isDismissed = typeof window !== "undefined" && localStorage.getItem("flygo-pwa-toast-dismissed") === "true";
    if (isDismissed) return;

    // Check if app is running in standalone mode (already installed)
    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")
    );
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Trigger the Shadcn Toast
      const { dismiss } = toast({
        title: "Install FlyGo Airlines",
        description: "Add FlyGo to your home screen or desktop for a fast, premium, app-like offline booking experience.",
        variant: "purple",
        duration: 300000, // Keep visible for up to 5 minutes so they can notice it
        action: (
          <ToastAction
            altText="Install FlyGo App"
            onClick={async () => {
              try {
                await promptEvent.prompt();
                const choiceResult = await promptEvent.userChoice;
                if (choiceResult.outcome === "accepted") {
                  localStorage.setItem("flygo-pwa-toast-dismissed", "true");
                }
              } catch (err) {
                console.error("PWA Installation failed:", err);
              } finally {
                dismiss();
              }
            }}
          >
            Install
          </ToastAction>
        ),
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [toast]);

  return null;
}
