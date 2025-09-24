import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from './contexts/AuthContext'
import { CompromissosEventProvider } from './contexts/CompromissosEventContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Index from './pages/Index'
import Medicacoes from './pages/Medicacoes'
import MedicacoesNew from './pages/MedicacoesNew'
import Agenda from './pages/Agenda'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Conquistas from './pages/Conquistas'
import ForgotPassword from './pages/ForgotPassword'
import Admin from './pages/Admin'
import AdminSignup from './pages/AdminSignup'
import NotFound from './pages/NotFound'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompromissosEventProvider>
          <Toaster />
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/medicacoes" element={<Medicacoes />} />
              <Route path="/medicacoes-new" element={<MedicacoesNew />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/conquistas" element={<Conquistas />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </CompromissosEventProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById("root")!).render(<App />);
