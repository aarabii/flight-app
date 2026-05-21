"use client";

import * as React from "react";
import { toast } from "sonner";

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

  React.useEffect(() => {
    const isDismissed =
      typeof window !== "undefined" &&
      localStorage.getItem("flygo-pwa-toast-dismissed") === "true";
    if (isDismissed) return;

    const isNavigator =
      typeof window !== "undefined" ? window.navigator : undefined;
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (isNavigator as Navigator & { standalone?: boolean }).standalone ||
        document.referrer.includes("android-app://"));
    if (isStandalone) return;

    const triggerToast = (promptEvent: BeforeInstallPromptEvent) => {
      setDeferredPrompt(promptEvent);

      const toastId = toast("Install FlyGo Airlines", {
        description:
          "Add FlyGo to your home screen or desktop for a fast, premium, app-like booking experience.",
        duration: 30000,
        action: {
          label: "Install",
          onClick: async () => {
            try {
              await promptEvent.prompt();
              const choiceResult = await promptEvent.userChoice;
              if (choiceResult.outcome === "accepted") {
                localStorage.setItem("flygo-pwa-toast-dismissed", "true");
              }
            } catch (err) {
              console.error("PWA Installation failed:", err);
            } finally {
              toast.dismiss(toastId);
            }
          },
        },
      });
    };

    // 1. Check if the prompt was already captured globally
    const existingPrompt = typeof window !== "undefined" ? (window as Window & { deferredAppInstallPrompt?: BeforeInstallPromptEvent | null }).deferredAppInstallPrompt : null;
    if (existingPrompt) {
      triggerToast(existingPrompt);
      return;
    }

    // 2. Listen to custom event if it is dispatched later
    const handleCustomPromptReady = (e: Event) => {
      const customEvent = e as CustomEvent<BeforeInstallPromptEvent>;
      if (customEvent.detail) {
        triggerToast(customEvent.detail);
      }
    };

    // 3. Fallback standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      triggerToast(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("pwa-prompt-available", handleCustomPromptReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("pwa-prompt-available", handleCustomPromptReady);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  return null;
}
