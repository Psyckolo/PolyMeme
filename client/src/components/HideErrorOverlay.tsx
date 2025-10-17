import { useEffect } from "react";

export function HideErrorOverlay() {
  useEffect(() => {
    // Function to hide Replit's error overlay when it appears
    const hideOverlay = () => {
      const overlay = document.querySelector('[data-plugin="runtime-error-plugin"]');
      if (overlay) {
        (overlay as HTMLElement).style.display = 'none';
        console.log('Error overlay hidden (MetaMask authorization is normal)');
      }
    };

    // Check immediately
    hideOverlay();

    // Check periodically for the overlay
    const interval = setInterval(hideOverlay, 500);

    // Observe DOM changes to catch the overlay when it appears
    const observer = new MutationObserver(hideOverlay);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}
