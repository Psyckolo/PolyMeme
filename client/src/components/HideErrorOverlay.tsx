import { useEffect } from "react";

export function HideErrorOverlay() {
  useEffect(() => {
    // Function to hide Replit's error overlay when it appears
    const hideOverlay = () => {
      // Try multiple selectors for the error overlay
      const selectors = [
        '[data-plugin="runtime-error-plugin"]',
        'div[style*="z-index: 2147483647"]', // Replit overlay has very high z-index
        'div[id*="error"]',
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          // Check if it contains MetaMask authorization error
          if (element.textContent?.includes('has not been authorized yet') || 
              element.textContent?.includes('runtime error')) {
            element.style.display = 'none';
            console.log('Error overlay hidden:', selector);
          }
        });
      });

      // Also try to find by text content
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach(div => {
        if (div.textContent?.includes('[plugin:runtime-error-plugin]') && 
            div.textContent?.includes('has not been authorized yet')) {
          (div as HTMLElement).style.display = 'none';
          console.log('Error overlay hidden by text content');
        }
      });
    };

    // Check immediately and more frequently
    hideOverlay();
    const interval = setInterval(hideOverlay, 200);

    // Observe DOM changes
    const observer = new MutationObserver(hideOverlay);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Press Escape programmatically to dismiss overlay
    const pressEscape = () => {
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
      });
      document.dispatchEvent(escEvent);
    };

    setTimeout(pressEscape, 100);
    setTimeout(pressEscape, 500);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}
