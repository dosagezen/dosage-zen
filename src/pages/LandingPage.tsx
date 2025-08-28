import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, Calendar, Bell, Target, CheckCircle, ChevronDown, 
  Heart, Shield, Users, Clock, Star, ArrowRight, Sparkles, Zap,
  Brain, Globe, Layers, Rocket, Award, Lock
} from "lucide-react";

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

  const faqs = [
    {
      id: "cancelamento",
      question: "Posso cancelar quando quiser?",
      answer: "Sim! Não há contrato de fidelidade. Você pode cancelar sua assinatura a qualquer momento através do app."
    },
    {
      id: "dispositivos",
      question: "Funciona em qualquer celular?",
      answer: "Sim, nosso app funciona em smartphones Android e iOS, além de ser acessível pelo navegador web."
    },
    {
      id: "seguranca",
      question: "Meus dados estão seguros?",
      answer: "Absolutamente! Utilizamos criptografia de ponta e seguimos rigorosamente as normas da LGPD para proteger seus dados de saúde."
    },
    {
      id: "compartilhamento",
      question: "Posso compartilhar com cuidadores?",
      answer: "Sim! Você pode dar acesso a familiares e cuidadores para que acompanhem seus medicamentos e consultas."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 animate-pulse"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-vibrant-purple/20 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-vibrant-blue/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-vibrant-pink/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-vibrant-green/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '0.5s'}}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Content Side */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass-effect rounded-full px-6 py-3">
                <Sparkles className="w-5 h-5 text-vibrant-yellow" />
                <span className="text-sm font-medium text-foreground">Nova Era da Saúde Digital</span>
                <Sparkles className="w-5 h-5 text-vibrant-yellow" />
              </div>
              
              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-foreground via-vibrant-purple to-vibrant-blue bg-clip-text text-transparent">
                    Revolução
                  </span>
                  <br />
                  <span className="text-foreground">em</span>
                  <br />
                  <span className="bg-gradient-to-r from-vibrant-pink via-vibrant-coral to-vibrant-yellow bg-clip-text text-transparent">
                    Cuidados
                  </span>
                </h1>
              </div>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                IA que cuida da sua saúde 24/7. 
                <span className="text-vibrant-purple font-semibold"> Inteligente, precisa e sempre presente.</span>
              </p>
              
              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={handleSignup}
                  size="lg" 
                  className="group bg-gradient-to-r from-vibrant-purple to-vibrant-pink hover:from-vibrant-pink hover:to-vibrant-coral text-white text-xl px-12 py-8 h-auto font-bold shadow-2xl hover-glow transition-all duration-500"
                >
                  <Rocket className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Começar Agora
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => scrollToSection('demo')}
                  className="glass-effect text-foreground border-foreground/20 hover:bg-foreground/10 text-lg px-8 py-8 h-auto font-semibold"
                >
                  Ver Demo
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 justify-center lg:justify-start pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-6 h-6 text-vibrant-green" />
                  <span className="font-medium">LGPD Certificado</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-6 h-6 text-vibrant-blue" />
                  <span className="font-medium">Dados Criptografados</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="w-6 h-6 text-vibrant-yellow" />
                  <span className="font-medium">ISO 27001</span>
                </div>
              </div>
            </div>

            {/* Visual Side - 3D Phone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative group">
                {/* Glow Effects */}
                <div className="absolute -inset-4 bg-gradient-to-r from-vibrant-purple to-vibrant-pink rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="absolute -inset-8 bg-gradient-to-r from-vibrant-blue to-vibrant-green rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
                
                {/* Phone Container */}
                <div className="relative glass-card rounded-[3rem] p-4 transform hover:rotate-3 transition-all duration-700 hover:scale-105">
                  <div className="w-80 h-[40rem] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-background to-surface rounded-[2rem] overflow-hidden relative">
                      {/* Phone Content Mockup */}
                      <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-vibrant-purple to-vibrant-pink rounded-full"></div>
                            <span className="font-bold text-foreground">DosageZen</span>
                          </div>
                          <div className="w-8 h-8 bg-vibrant-green rounded-full"></div>
                        </div>
                        
                        {/* Progress Cards */}
                        <div className="space-y-4">
                          <div className="glass-card rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-vibrant-blue rounded-full flex items-center justify-center">
                                <Bell className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-foreground">Próxima medicação</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-3/4 bg-gradient-to-r from-vibrant-blue to-vibrant-purple rounded-full"></div>
                            </div>
                          </div>
                          
                          <div className="glass-card rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-vibrant-green rounded-full flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-foreground">Consulta hoje</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-1/2 bg-gradient-to-r from-vibrant-green to-vibrant-yellow rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="glass-card rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-vibrant-purple">98%</div>
                            <div className="text-xs text-muted-foreground">Adesão</div>
                          </div>
                          <div className="glass-card rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-vibrant-green">15</div>
                            <div className="text-xs text-muted-foreground">Dias</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section id="features" className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue/5 to-vibrant-purple/5"></div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 glass-effect rounded-full px-6 py-3 mb-6">
              <Brain className="w-5 h-5 text-vibrant-purple" />
              <span className="text-sm font-medium text-foreground">Tecnologia de Ponta</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Recursos que <span className="bg-gradient-to-r from-vibrant-purple to-vibrant-pink bg-clip-text text-transparent">Transformam</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cada detalhe foi pensado para revolucionar como você cuida da sua saúde
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-blue to-vibrant-purple rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  IA Preditiva
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Algoritmos avançados que aprendem seus padrões e antecipam suas necessidades de saúde
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-green to-vibrant-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Sync Multiplataforma
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Acesse seus dados em qualquer dispositivo com sincronização em tempo real
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-pink to-vibrant-coral rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Precisão Cirúrgica
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Lembretes personalizados baseados em machine learning para máxima eficácia
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-purple to-vibrant-pink rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Rede de Cuidados
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Conecte familiares e profissionais em um ecossistema integrado de saúde
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-blue to-vibrant-green rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Cloud Seguro
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Infraestrutura global com criptografia militar para seus dados de saúde
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group">
              <div className="glass-card rounded-3xl p-8 hover-glow h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-yellow to-vibrant-coral rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Analytics Avançado
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Insights profundos sobre sua saúde com visualizações interativas e relatórios
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Demo Section */}
      <section id="demo" className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Interface <span className="bg-gradient-to-r from-vibrant-blue to-vibrant-green bg-clip-text text-transparent">Revolucionária</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Design que prioriza a experiência humana com tecnologia de ponta
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dashboard Preview */}
            <div className="glass-card rounded-3xl p-8 hover-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-vibrant-blue to-vibrant-purple rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Dashboard Intuitivo</h4>
                  <p className="text-sm text-muted-foreground">Visão 360° da sua saúde</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-gradient-to-r from-vibrant-blue to-vibrant-purple rounded-full"></div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-gradient-to-r from-vibrant-green to-vibrant-yellow rounded-full"></div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-vibrant-pink to-vibrant-coral rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Medications Preview */}
            <div className="glass-card rounded-3xl p-8 hover-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-vibrant-green to-vibrant-yellow rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Smart Reminders</h4>
                  <p className="text-sm text-muted-foreground">IA que aprende sua rotina</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-vibrant-green" />
                  <span className="text-sm text-foreground font-medium">Omeprazol - 8:00</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Losartana - 20:00</span>
                </div>
              </div>
            </div>

            {/* Analytics Preview */}
            <div className="glass-card rounded-3xl p-8 hover-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-vibrant-pink to-vibrant-coral rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Analytics Pro</h4>
                  <p className="text-sm text-muted-foreground">Insights que transformam</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Adesão</span>
                  <span className="text-lg font-bold text-vibrant-green">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="text-lg font-bold text-vibrant-blue">15 dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Pricing Section */}
      <section id="pricing" className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-green/5 to-vibrant-yellow/5"></div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 glass-effect rounded-full px-6 py-3 mb-6">
              <Zap className="w-5 h-5 text-vibrant-yellow" />
              <span className="text-sm font-medium text-foreground">Sem Complicações</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Um Plano, <span className="bg-gradient-to-r from-vibrant-green to-vibrant-yellow bg-clip-text text-transparent">Infinitas Possibilidades</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simplicidade que potencializa resultados extraordinários
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="glass-card rounded-3xl p-10 hover-glow border-2 border-vibrant-purple/20">
              <div className="mb-8">
                <div className="text-6xl font-bold bg-gradient-to-r from-vibrant-purple to-vibrant-pink bg-clip-text text-transparent mb-2">
                  R$ 65
                </div>
                <div className="text-xl text-muted-foreground">/mês</div>
                <div className="text-sm text-vibrant-green font-medium mt-2">
                  7 dias grátis • Cancele quando quiser
                </div>
              </div>
              
              <div className="space-y-4 text-left mb-10">
                {[
                  "Lembretes inteligentes ilimitados",
                  "Agenda completa de saúde",
                  "Compartilhamento familiar",
                  "Analytics avançado",
                  "Suporte 24/7",
                  "Garantia de 7 dias",
                  "Backup automático na nuvem",
                  "Integração com wearables"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-vibrant-green to-vibrant-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-vibrant-purple to-vibrant-pink hover:from-vibrant-pink hover:to-vibrant-coral text-white font-bold text-lg h-14 rounded-2xl hover-glow"
              >
                <Rocket className="mr-2 w-5 h-5" />
                Começar Gratuitamente
              </Button>
              
              <p className="text-sm text-muted-foreground mt-6">
                💳 Cartão • 🔒 Seguro • ⚡ Ativação Instantânea
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Testimonials */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue/5 to-vibrant-purple/5"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Histórias de <span className="bg-gradient-to-r from-vibrant-coral to-vibrant-pink bg-clip-text text-transparent">Transformação</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pessoas reais, resultados extraordinários
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                age: "42 anos",
                role: "Empresária",
                text: "Revolucionou minha rotina! A IA aprendeu meus horários e nunca mais esqueci um remédio. Minha pressão está perfeita há 6 meses.",
                rating: 5
              },
              {
                name: "João Santos",
                age: "37 anos", 
                role: "Cuidador",
                text: "Perfeito para acompanhar as medicações do meu pai. A família toda tem acesso e recebe notificações. Tranquilidade total!",
                rating: 5
              },
              {
                name: "Ana Costa",
                age: "29 anos",
                role: "Designer",
                text: "Interface linda e funcional! Até minha avó de 80 anos usa sozinha. Os relatórios ajudam muito nas consultas médicas.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="glass-card rounded-3xl p-8 hover-glow">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-vibrant-yellow text-vibrant-yellow" />
                  ))}
                </div>
                <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                  "{testimonial.text}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-vibrant-purple to-vibrant-pink rounded-full"></div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.age} • {testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern FAQ */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-pink/5 to-vibrant-coral/5"></div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Dúvidas <span className="bg-gradient-to-r from-vibrant-pink to-vibrant-coral bg-clip-text text-transparent">Frequentes</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Respostas rápidas para suas principais questões
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="glass-card rounded-2xl p-6 text-left hover-glow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 glass-card rounded-2xl p-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Final CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-purple/10 to-vibrant-pink/10"></div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 glass-effect rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-vibrant-yellow" />
              <span className="text-sm font-medium text-foreground">Transforme Sua Vida Hoje</span>
            </div>
            
            <h2 className="text-4xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-coral bg-clip-text text-transparent">
                Revolução
              </span>
              <br />
              <span className="text-foreground">começa agora</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Junte-se a milhares de pessoas que já revolucionaram seus cuidados de saúde
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button 
                onClick={handleSignup}
                size="lg"
                className="group bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-coral hover:from-vibrant-coral hover:to-vibrant-yellow text-white text-2xl px-16 py-10 h-auto font-bold shadow-2xl hover-glow transition-all duration-500"
              >
                <Rocket className="mr-4 w-8 h-8 group-hover:rotate-12 transition-transform" />
                Começar Revolução
                <Sparkles className="ml-4 w-8 h-8 group-hover:scale-125 transition-transform" />
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-8 justify-center pt-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-6 h-6 text-vibrant-green" />
                <span className="font-medium">7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-6 h-6 text-vibrant-blue" />
                <span className="font-medium">Sem fidelidade</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-6 h-6 text-vibrant-yellow" />
                <span className="font-medium">Satisfação garantida</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-16 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-vibrant-purple to-vibrant-pink rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">DosageZen</span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Revolucionando os cuidados de saúde através de tecnologia inteligente e design centrado no ser humano.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <div className="space-y-3">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Funcionalidades</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Preços</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Segurança</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
              <div className="space-y-3">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Central de Ajuda</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Contato</div>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Status</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 DosageZen. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacidade</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Termos</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">LGPD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;