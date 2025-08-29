import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Calendar, Bell, Target, CheckCircle, ChevronDown, Heart, Shield, Users, Clock, Star, ArrowRight, Sparkles, Zap } from "lucide-react";
import heroImage from "@/assets/hero-health-bg.jpg";
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
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 min-h-[100vh] flex items-center bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `linear-gradient(rgba(52, 78, 65, 0.7), rgba(58, 90, 64, 0.8)), url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue/20 via-vibrant-purple/10 to-vibrant-pink/20"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content Side */}
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-6 justify-center lg:justify-start">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-vibrant-yellow" />
                  <span className="text-sm font-medium text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    Nova geração de cuidados
                  </span>
                  <Sparkles className="w-5 h-5 text-vibrant-yellow" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Sua saúde<br />
                <span className="bg-gradient-to-r from-white via-vibrant-yellow to-white bg-clip-text text-transparent font-extrabold">
                  revolucionada
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Tecnologia inteligente que transforma como você cuida da sua saúde. 
                <span className="text-vibrant-yellow font-semibold">Simples, eficaz e sempre com você.</span>
              </p>
              
              <div className="flex justify-center lg:justify-start">
                <Button onClick={handleSignup} size="lg" className="bg-gradient-to-r from-vibrant-blue to-vibrant-purple hover:from-vibrant-purple hover:to-vibrant-pink text-white text-xl px-10 py-7 h-auto font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                  <Zap className="mr-2 w-6 h-6" />
                  Começar Agora
                </Button>
              </div>
              
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-white/80">
                  <Shield className="w-5 h-5 text-vibrant-green" />
                  <span className="text-sm font-medium">100% Seguro</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-5 h-5 text-vibrant-green" />
                  <span className="text-sm font-medium">Sem Fidelidade</span>
                </div>
              </div>
            </div>

            {/* Visual Side - Enhanced Mobile Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-vibrant-yellow/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-vibrant-pink/20 rounded-full blur-xl animate-pulse delay-1000"></div>
                
                {/* Phone Mockup */}
                <div className="relative w-64 h-[32rem] bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-2 shadow-2xl transform hover:rotate-2 transition-transform duration-500">
                  <img src="/lovable-uploads/3667c683-13c3-4104-b70a-9b5ad3235935.png" alt="Dosage Zen App Dashboard" className="w-full h-full object-cover rounded-[2rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section id="valor" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Por que o DosageZen?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Inteligência que cuida da sua saúde 24/7</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-vibrant-blue">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-blue to-vibrant-purple rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Nunca mais esqueça uma medicação
                </h3>
                <p className="text-muted-foreground">
                  Alertas precisos no horário certo para cada remédio
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-vibrant-green">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-green to-vibrant-yellow rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Notificações inteligentes
                </h3>
                <p className="text-muted-foreground">
                  Sistema que aprende seus hábitos e se adapta à sua rotina
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-vibrant-purple">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-purple to-vibrant-pink rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Agenda unificada de saúde
                </h3>
                <p className="text-muted-foreground">
                  Consultas, exames e atividades organizados em um só lugar
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-vibrant-pink">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-vibrant-pink to-vibrant-blue rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Progresso visível
                </h3>
                <p className="text-muted-foreground">
                  Acompanhe sua evolução com conquistas e estatísticas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demonstração Visual */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Veja como é simples acompanhar sua saúde
            </h2>
            <p className="text-lg text-muted-foreground">
              Interface intuitiva desenvolvida pensando em você
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="bg-card p-6 rounded-lg border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-consulta rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Dashboard</h4>
                    <p className="text-sm text-muted-foreground">Visão geral da sua saúde</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Medicações hoje</span>
                    <span className="text-sm font-semibold text-primary">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Consultas este mês</span>
                    <span className="text-sm font-semibold text-success">3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card p-6 rounded-lg border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Medicações</h4>
                    <p className="text-sm text-muted-foreground">Lembretes inteligentes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">Omeprazol - 8:00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Losartana - 20:00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card p-6 rounded-lg border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Compromissos</h4>
                    <p className="text-sm text-muted-foreground">Agenda organizada</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Badge variant="outline" className="text-xs">Consulta - Cardiologista</Badge>
                  <Badge variant="outline" className="text-xs">Exame - Hemograma</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plano e Preço */}
      <section id="preco" className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Plano único, preço justo
          </h2>
          
          <Card className="max-w-md mx-auto p-8 shadow-xl border-2 border-primary/20">
            <CardContent className="space-y-6">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">R$ 65</div>
                <div className="text-lg text-muted-foreground">/mês</div>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Lembretes ilimitados de medicações</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Agenda completa de consultas e exames</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Compartilhamento com cuidadores</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Relatórios de adesão</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Suporte prioritário</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={handleSignup} className="w-full bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] font-semibold text-lg h-12">
                  Assinar Agora
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Pagamento com cartão de crédito • Cancelamento imediato, sem fidelidade
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testemunhos */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-lg text-muted-foreground">
              Histórias reais de quem transformou sua rotina de saúde
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 shadow-lg">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />)}
                </div>
                <blockquote className="text-foreground italic">
                  "O app mudou minha rotina! Nunca mais esqueci um remédio e minha pressão está controlada."
                </blockquote>
                <div className="text-sm text-muted-foreground">
                  — Maria Silva, 42 anos
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 shadow-lg">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />)}
                </div>
                <blockquote className="text-foreground italic">
                  "Consigo acompanhar as medicações do meu pai facilmente. A família toda tem acesso."
                </blockquote>
                <div className="text-sm text-muted-foreground">
                  — João Santos, 37 anos
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 shadow-lg">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />)}
                </div>
                <blockquote className="text-foreground italic">
                  "Interface simples e intuitiva. Até minha avó de 80 anos consegue usar sozinha."
                </blockquote>
                <div className="text-sm text-muted-foreground">
                  — Ana Costa, 28 anos
                </div>
              </CardContent>
            </Card>
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-primary via-primary-light to-success">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Comece agora a organizar sua saúde
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Junte-se a milhares de pessoas que já transformaram sua rotina de medicações
          </p>
          
          <div className="space-y-4">
            <Button onClick={handleSignup} size="lg" className="bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
              Assinar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <p className="text-sm opacity-75">
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