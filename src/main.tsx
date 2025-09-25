import React from 'react'
import { createRoot } from 'react-dom/client'
import { CompromissosEventProvider } from './contexts/CompromissosEventContext'
import App from './App'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <CompromissosEventProvider>
    <App />
  </CompromissosEventProvider>
);
