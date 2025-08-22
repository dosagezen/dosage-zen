import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Conquistas from "./pages/Conquistas";
import Medicacoes from "./pages/Medicacoes";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import EsqueciSenha from "./pages/EsqueciSenha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border/50 bg-card/50 backdrop-blur-sm px-4">
              <SidebarTrigger className="mr-4 h-10 w-10 md:h-8 md:w-8" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">D</span>
                </div>
                <span className="font-semibold text-primary">Dosage Zen</span>
              </div>
            </header>
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/conquistas" element={<Conquistas />} />
                <Route path="/medicacoes" element={<Medicacoes />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/farmacias" element={<div className="p-6"><h1 className="text-2xl text-primary">Farmácias - Em desenvolvimento</h1></div>} />
                <Route path="/compartilhar" element={<div className="p-6"><h1 className="text-2xl text-primary">Compartilhar - Em desenvolvimento</h1></div>} />
                <Route path="/relatorios" element={<div className="p-6"><h1 className="text-2xl text-primary">Relatórios - Em desenvolvimento</h1></div>} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;