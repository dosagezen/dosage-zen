import React from 'react'
import { createRoot } from 'react-dom/client'
import { CompromissosEventProvider } from './contexts/CompromissosEventContext'
import App from './App'
import './index.css'

// Redirect from Lovable domain to custom domain in production
if (import.meta.env.MODE === 'production' && location.hostname.endsWith('lovable.app')) {
  location.replace(`https://go.dosagezen.com${location.pathname}${location.search}${location.hash}`);
}

createRoot(document.getElementById("root")!).render(
  <CompromissosEventProvider>
    <App />
  </CompromissosEventProvider>
);
