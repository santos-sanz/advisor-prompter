"use client";

import { useEffect } from "react";

export function TallyScript() {
  useEffect(() => {
    const loadTally = () => {
      // If Tally is already defined, initialize embeds
      if (typeof (window as any).Tally !== "undefined") {
        (window as any).Tally.loadEmbeds();
        return;
      }
      
      // Otherwise initialize iframes manually
      document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((iframe: Element) => {
        if (iframe instanceof HTMLIFrameElement && iframe.dataset.tallySrc) {
          iframe.src = iframe.dataset.tallySrc;
        }
      });
    };

    // Load the Tally script if not already present
    if (!document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://tally.so/widgets/embed.js";
      script.async = true;
      script.onload = loadTally;
      script.onerror = loadTally; // Still try to load iframes even if script fails
      document.body.appendChild(script);
    } else {
      // Script already exists, just initialize
      loadTally();
    }

    // Run initialization immediately in case iframes exist before script loads
    loadTally();

    // Also add a fallback timer to ensure iframes are loaded
    const timer = setTimeout(loadTally, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}
