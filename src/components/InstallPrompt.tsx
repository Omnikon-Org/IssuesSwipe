"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [isReady, setIsReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only run on client
    setIsReady(true);
    
    // Check if the app is already installed/running in standalone mode
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed === "true") return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isWebKit = !!ua.match(/WebKit/i);
    const isIOSDevice = (isIPad || isIPhone) && isWebKit && !ua.match(/CriOS/i);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS doesn't support beforeinstallprompt, just show the manual prompt
      setShowPrompt(true);
    }

    // Listen for Android/Desktop native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    // Clear prompt regardless of outcome (browser won't let us use it again)
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "true");
  };

  if (!isReady || isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-20 lg:bottom-6 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-dark-card border border-dark-border rounded-2xl p-4 shadow-2xl z-[100] flex items-start gap-4 glass-premium"
      >
        <div className="bg-brand-purple/20 p-2.5 rounded-xl shrink-0">
          <Download className="h-6 w-6 text-brand-purple" />
        </div>
        
        <div className="flex-grow">
          <h3 className="text-sm font-bold text-text-primary mb-1">Install IssueSwipe</h3>
          
          {isIOS ? (
            <p className="text-xs text-text-secondary leading-snug mb-3">
              Install this app on your device: tap <Share className="inline h-3.5 w-3.5 mb-0.5 mx-0.5" /> and then <span className="font-bold text-text-primary">Add to Home Screen</span>.
            </p>
          ) : (
            <>
              <p className="text-xs text-text-secondary leading-snug mb-3">
                Add IssueSwipe to your home screen for a faster, full-screen experience.
              </p>
              <button 
                onClick={handleInstallClick}
                className="w-full py-2 bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
              >
                Install App
              </button>
            </>
          )}
        </div>
        
        <button 
          onClick={handleDismiss}
          className="p-1 -mr-2 -mt-2 text-text-tertiary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-pill shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
