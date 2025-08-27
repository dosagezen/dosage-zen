import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Calendar, 
  Bell, 
  Target, 
  CheckCircle, 
  ChevronDown,
  Heart,
  Shield,
  Users,
  Clock,
  Star,
  ArrowRight
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const handleSignup = () => {
    navigate('/signup');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
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
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-48 h-96 md:w-64 md:h-[32rem] bg-primary rounded-[2.5rem] p-4 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500">
                <div className="w-full h-full bg-gradient-to-br from-background to-accent/10 rounded-[2rem] p-6 overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-20 h-3 bg-primary rounded-full"></div>
                      <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-card p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-consulta rounded-full"></div>
                          <div className="flex-1">
                            <div className="w-20 h-2 bg-muted rounded"></div>
                            <div className="w-16 h-1 bg-muted rounded mt-1"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-exame rounded-full"></div>
                          <div className="flex-1">
                            <div className="w-24 h-2 bg-muted rounded"></div>
                            <div className="w-12 h-1 bg-muted rounded mt-1"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-atividade rounded-full"></div>
                          <div className="flex-1">
                            <div className="w-18 h-2 bg-muted rounded"></div>
                            <div className="w-20 h-1 bg-muted rounded mt-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Sua saúde organizada<br />
            <span className="text-primary">em um só lugar</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Controle medicações, consultas, exames e atividades em poucos cliques. 
            Nunca mais esqueça um compromisso importante da sua saúde.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleSignup}
              size="lg"
              className="bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Assinar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Cancelamento imediato, sem contrato de fidelidade</span>
            </div>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section id="valor" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher nosso app?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnologia inteligente que cuida da sua saúde 24/7
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Nunca mais esqueça uma medicação
                </h3>
                <p className="text-muted-foreground">
                  Alertas precisos no horário certo para cada remédio
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Notificações inteligentes
                </h3>
                <p className="text-muted-foreground">
                  Sistema que aprende seus hábitos e se adapta à sua rotina
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Agenda unificada de saúde
                </h3>
                <p className="text-muted-foreground">
                  Consultas, exames e atividades organizados em um só lugar
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-[hsl(var(--cta))]/20 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-[hsl(var(--cta-foreground))]" />
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
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Dashboard</h4>
                    <p className="text-sm text-muted-foreground">Visão geral da sua saúde</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full"></div>
                  </div>
                  <div className="h-2 bg-success/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-success rounded-full"></div>
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
                <div className="space-y-2">
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
                <Button 
                  onClick={handleSignup}
                  className="w-full bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] font-semibold text-lg h-12"
                >
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
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />
                  ))}
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
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />
                  ))}
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
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />
                  ))}
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
            {faqs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <Collapsible 
                  open={openFaq === faq.id}
                  onOpenChange={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                >
                  <CollapsibleTrigger className="w-full p-6 text-left hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                      <ChevronDown 
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          openFaq === faq.id ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
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
            <Button 
              onClick={handleSignup}
              size="lg"
              className="bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
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
              <h4 className="font-semibold mb-4">Links Úteis</h4>
              <div className="space-y-2 text-sm">
                <button 
                  onClick={() => scrollToSection('valor')}
                  className="block hover:underline opacity-75 hover:opacity-100 transition-opacity"
                >
                  Funcionalidades
                </button>
                <button 
                  onClick={() => scrollToSection('preco')}
                  className="block hover:underline opacity-75 hover:opacity-100 transition-opacity"
                >
                  Preços
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="block hover:underline opacity-75 hover:opacity-100 transition-opacity"
                >
                  FAQ
                </button>
              </div>
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
                <a href="#" className="block hover:underline opacity-75 hover:opacity-100 transition-opacity">
                  Contato
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
    </div>
  );
};

export default LandingPage;