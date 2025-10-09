import React from 'react'
import { createRoot } from 'react-dom/client'
import { CompromissosEventProvider } from './contexts/CompromissosEventContext'
import App from './App'
import './index.css'
import { registerServiceWorker } from './lib/notifications/service-worker-utils'

// Redirect from Lovable domain to custom domain in production
if (import.meta.env.MODE === 'production' && location.hostname.endsWith('lovable.app')) {
  location.replace(`https://dosagezen.com${location.pathname}${location.search}${location.hash}`);
}

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch(err => {
      console.error('Failed to register service worker:', err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CompromissosEventProvider>
      <App />
    </CompromissosEventProvider>
  </React.StrictMode>
);
