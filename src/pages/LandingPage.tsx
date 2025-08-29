import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Calendar, Bell, Target, CheckCircle, ChevronDown, Heart, Shield, Users, Clock, Star, ArrowRight, Sparkles, Zap, Activity, TrendingUp, Award, Globe } from "lucide-react";
const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const handleSignup = () => {
    navigate('/signup');
  };
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const faqs = [{
    id: "cancelamento",
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Não há contrato de fidelidade. Você pode cancelar sua assinatura a qualquer momento através do app."
  }, {
    id: "dispositivos",
    question: "Funciona em qualquer celular?",
    answer: "Sim, nosso app funciona em smartphones Android e iOS, além de ser acessível pelo navegador web."
  }, {
    id: "seguranca",
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Utilizamos criptografia de ponta e seguimos rigorosamente as normas da LGPD para proteger seus dados de saúde."
  }, {
    id: "compartilhamento",
    question: "Posso compartilhar com cuidadores?",
    answer: "Sim! Você pode dar acesso a familiares e cuidadores para que acompanhem seus medicamentos e consultas."
  }];
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 min-h-[100vh] flex items-center bg-gradient-mesh">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-vibrant-blue/30 to-vibrant-purple/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-vibrant-pink/25 to-vibrant-coral/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-vibrant-yellow/20 to-vibrant-green/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content Side */}
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-6 justify-center lg:justify-start">
                <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                    Nova geração de cuidados
                  </span>
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse delay-300" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tight">
                Sua saúde<br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
                  revolucionada
                </span>
              </h1>
              
              <p className="text-xl md:text-3xl text-white/95 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Tecnologia inteligente que transforma como você cuida da sua saúde. 
                <span className="text-gradient font-bold">Simples, eficaz e sempre com você.</span>
              </p>
              
              <div className="flex justify-center lg:justify-start">
                <Button 
                  onClick={handleSignup} 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-500 hover:to-orange-500 text-white text-2xl px-12 py-8 h-auto font-black shadow-2xl hover:shadow-glow transition-all duration-700 transform hover:scale-110 hover:-rotate-1 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Zap className="mr-3 w-7 h-7 animate-pulse" />
                  <span className="relative z-10">Começar Agora</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 mt-10 justify-center lg:justify-start">
                <div className="glass-morphism px-4 py-3 rounded-lg flex items-center gap-3 hover-lift">
                  <Shield className="w-6 h-6 text-green-400" />
                  <span className="text-sm font-bold text-white">100% Seguro</span>
                </div>
                <div className="glass-morphism px-4 py-3 rounded-lg flex items-center gap-3 hover-lift">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                  <span className="text-sm font-bold text-white">Sem Fidelidade</span>
                </div>
              </div>
            </div>

            {/* Visual Side - 3D Enhanced Mobile Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Dynamic Floating Elements */}
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-pink-500/30 to-purple-600/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 -left-8 w-16 h-16 bg-gradient-to-br from-blue-400/25 to-cyan-500/25 rounded-full blur-xl animate-pulse delay-500"></div>
                <div className="absolute top-1/4 -right-8 w-14 h-14 bg-gradient-to-br from-green-400/25 to-emerald-500/25 rounded-full blur-xl animate-pulse delay-700"></div>
                
                {/* 3D Phone Mockup */}
                <div className="relative w-72 h-[36rem] perspective-1000">
                  <div className="glass-card rounded-[3rem] p-3 shadow-glow transform hover:rotateY-12 hover:rotateX-5 transition-all duration-700 hover:scale-105">
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 rounded-[2.5rem]"></div>
                      <img 
                        src="/lovable-uploads/3667c683-13c3-4104-b70a-9b5ad3235935.png" 
                        alt="Dosage Zen App Dashboard" 
                        className="w-full h-full object-cover rounded-[2.3rem] relative z-10" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section id="valor" className="py-20 md:py-32 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Por que o DosageZen?
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-light">
              Inteligência que cuida da sua saúde 24/7 com tecnologia de ponta
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card text-center p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Nunca mais esqueça uma medicação
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Alertas precisos no horário certo para cada remédio
                </p>
              </div>
            </div>

            <div className="glass-card text-center p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">
                  Notificações inteligentes
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Sistema que aprende seus hábitos e se adapta à sua rotina
                </p>
              </div>
            </div>

            <div className="glass-card text-center p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  Agenda unificada de saúde
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Consultas, exames e atividades organizados em um só lugar
                </p>
              </div>
            </div>

            <div className="glass-card text-center p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  Progresso visível
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Acompanhe sua evolução com conquistas e estatísticas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstração Visual */}
      <section className="py-20 md:py-32 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-orange-200/40 to-red-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              Veja como é simples acompanhar sua saúde
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-light">
              Interface intuitiva desenvolvida pensando em você
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Dashboard</h4>
                  <p className="text-sm text-slate-600 font-medium">Visão geral da sua saúde</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                </div>
                <div className="h-3 bg-gradient-to-r from-green-200 to-green-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">Medicações</h4>
                  <p className="text-sm text-slate-600 font-medium">Lembretes inteligentes</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Omeprazol - 8:00</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">Losartana - 20:00</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Compromissos</h4>
                  <p className="text-sm text-slate-600 font-medium">Agenda organizada</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                  <span className="text-sm font-semibold text-purple-700">Consulta - Cardiologista</span>
                </div>
                <div className="bg-pink-50 px-4 py-2 rounded-xl border border-pink-200">
                  <span className="text-sm font-semibold text-pink-700">Exame - Hemograma</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plano e Preço */}
      <section id="preco" className="py-20 md:py-32 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-orange-600 to-red-600 bg-clip-text text-transparent mb-12">
            Plano único, preço justo
          </h2>
          
          <div className="glass-card max-w-md mx-auto p-10 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 space-y-8">
              <div>
                <div className="text-6xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-3">R$ 65</div>
                <div className="text-xl text-slate-600 font-medium">/mês</div>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-slate-700">Lembretes ilimitados de medicações</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-slate-700">Agenda completa de consultas e exames</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-slate-700">Compartilhamento com cuidadores</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                  <span className="font-medium text-slate-700">Relatórios de adesão</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-pink-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-pink-600" />
                  <span className="font-medium text-slate-700">Suporte prioritário</span>
                </div>
              </div>
              
              <div className="pt-6">
                <Button 
                  onClick={handleSignup} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-black text-xl h-16 shadow-xl hover:shadow-glow transition-all duration-500 transform hover:scale-105 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Assinar Agora</span>
                </Button>
                <p className="text-sm text-slate-600 mt-4 font-medium">
                  Pagamento com cartão de crédito • Cancelamento imediato, sem fidelidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testemunhos */}
      <section className="py-20 md:py-32 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-light">
              Histórias reais de quem transformou sua rotina de saúde
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}
                </div>
                <blockquote className="text-slate-800 italic text-lg font-medium leading-relaxed">
                  "O app mudou minha rotina! Nunca mais esqueci um remédio e minha pressão está controlada."
                </blockquote>
                <div className="text-sm text-slate-600 font-semibold">
                  — Maria Silva, 42 anos
                </div>
              </div>
            </div>

            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}
                </div>
                <blockquote className="text-slate-800 italic text-lg font-medium leading-relaxed">
                  "Consigo acompanhar as medicações do meu pai facilmente. A família toda tem acesso."
                </blockquote>
                <div className="text-sm text-slate-600 font-semibold">
                  — João Santos, 37 anos
                </div>
              </div>
            </div>

            <div className="glass-card p-8 hover-lift hover:shadow-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}
                </div>
                <blockquote className="text-slate-800 italic text-lg font-medium leading-relaxed">
                  "Interface simples e intuitiva. Até minha avó de 80 anos consegue usar sozinha."
                </blockquote>
                <div className="text-sm text-slate-600 font-semibold">
                  — Ana Costa, 28 anos
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre nosso serviço
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map(faq => <Card key={faq.id} className="overflow-hidden">
                <Collapsible open={openFaq === faq.id} onOpenChange={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                  <CollapsibleTrigger className="w-full p-6 text-left hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CollapsibleContent>
                </Collapsible>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 md:py-32 px-4 bg-gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/25 to-pink-500/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90"></div>
        
        <div className="max-w-5xl mx-auto text-center text-white relative z-10">
          <h2 className="text-4xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Comece agora a organizar sua saúde
          </h2>
          <p className="text-xl md:text-3xl mb-12 text-white/90 font-light max-w-4xl mx-auto leading-relaxed">
            Junte-se a milhares de pessoas que já transformaram sua rotina de medicações
          </p>
          
          <div className="space-y-6">
            <Button 
              onClick={handleSignup} 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-purple-600 hover:via-blue-500 hover:to-cyan-500 text-white text-2xl px-12 py-8 h-auto font-black shadow-2xl hover:shadow-glow transition-all duration-700 transform hover:scale-110 hover:-rotate-1 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Assinar Agora</span>
              <ArrowRight className="ml-3 w-7 h-7 relative z-10 animate-pulse" />
            </Button>
            
            <p className="text-lg text-white/75 font-medium">
              Plano único R$ 65/mês • Sem fidelidade
            </p>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="py-12 px-4 bg-primary text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Dosage Zen</h3>
              <p className="text-sm opacity-75">
                Sua saúde organizada e no tempo certo.
              </p>
            </div>
            
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:underline opacity-75 hover:opacity-100 transition-opacity">
                  Política de Privacidade
                </a>
                <a href="#" className="block hover:underline opacity-75 hover:opacity-100 transition-opacity">
                  Termos de Uso
                </a>
                
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-sm opacity-75">
              © 2024 Dosage Zen. Todos os direitos reservados.
            </p>
            <p className="text-xs opacity-60 mt-2">
              Pagamentos seguros via cartão de crédito
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;