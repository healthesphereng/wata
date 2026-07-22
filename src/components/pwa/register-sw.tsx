'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker once, after load. Rendered near the root so the
 * app becomes installable and shell-cached on the user's first visit.
 */
export function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing (e.g. private mode) must not break the app.
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
