import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ContextSelector } from "@/components/ContextSelector";
import Dashboard from "./pages/Dashboard";
import Conquistas from "./pages/Conquistas";
import Medicacoes from "./pages/Medicacoes";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

const AppLayout = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <button 
                onClick={() => navigate('/app/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">D</span>
                </div>
                <span className="font-semibold text-primary">DosageZen</span>
              </button>
            </div>
            <ContextSelector />
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/conquistas" element={<Conquistas />} />
              <Route path="/medicacoes" element={<Medicacoes />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              
              {/* Placeholder routes */}
              <Route path="/farmacias" element={<div className="p-6"><h1 className="text-2xl text-primary">Farmácias - Em desenvolvimento</h1></div>} />
              <Route path="/compartilhar" element={<div className="p-6"><h1 className="text-2xl text-primary">Compartilhar - Em desenvolvimento</h1></div>} />
              <Route path="/relatorios" element={<Relatorios />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/app/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;