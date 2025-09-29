import { Calendar, Clock, Pill, Plus, TrendingUp, Users, User, Stethoscope, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import AddMedicationDialog from "@/components/AddMedicationDialog";
import CompromissosModal from "@/components/CompromissosModal";
import { useMedications } from "@/hooks/useMedications";
import { useAppointments } from "@/hooks/useAppointments";
import { useCompromissosDodia } from "@/hooks/useCompromissosDodia";
import { useConquests } from "@/hooks/useConquests";
import { useAuth } from "@/contexts/AuthContext";
import { formatTime24h } from "@/lib/utils";

// Função utilitária para saudação baseada no horário
const getGreetingByTime = (timezone?: string): string => {
  const currentTime = new Date();
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Obter a hora local do usuário
  const localHour = new Date(currentTime.toLocaleString("en-US", { timeZone })).getHours();
  
  if (localHour >= 5 && localHour < 12) {
    return "Bom dia";
  } else if (localHour >= 12 && localHour < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isAddCompromissoOpen, setIsAddCompromissoOpen] = useState(false);
  const { user, profile, currentContext } = useAuth();
  
  // Hooks para dados reais
  const { medications, isLoading: medicationsLoading, refetchMedications } = useMedications();
  const { appointments: allAppointments, isLoading: appointmentsLoading, refetchAppointments } = useAppointments(undefined, currentContext);
  const { appointments: consultas } = useAppointments('consulta', currentContext);
  const { appointments: exames } = useAppointments('exame', currentContext);
  const { total, concluidos, restantes } = useCompromissosDodia();
  
  // Hook para conquistas da semana
  const { summary: conquistasSemana } = useConquests({ period: 'semana', category: 'todas' });

  // Detectar parâmetro modal=compromissos para reabrir o modal
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'compromissos') {
      setIsDayModalOpen(true);
      // Limpar o parâmetro da URL
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  // Processar medicações ativas
  const medicacoesAtivas = medications?.filter(med => med.ativo) || [];
  const proximasMedicacoes = medicacoesAtivas.slice(0, 3).map(med => ({
    nome: med.nome,
    dosagem: med.dosagem,
    horario: med.horarios?.[0] || "Sem horário",
    status: "pendente"
  }));

  // Processar próximos compromissos (próximos 7 dias)
  const hoje = new Date();
  const proximosDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const compromissosProximos = allAppointments?.filter(apt => {
    const dataApt = new Date(apt.data_agendamento);
    return dataApt >= hoje && dataApt <= proximosDias;
  }).slice(0, 5) || [];

  // Calcular estatísticas - medicações com horários pendentes hoje + compromissos agendados para hoje
  const medicacoesHoje = medicacoesAtivas.filter(med => {
    // Verificar se tem horários pendentes para hoje
    if (!Array.isArray(med.horarios) || med.horarios.length === 0) return false;
    
    // Se tem data de início/fim, verificar se está no período ativo
    const hoje_date = hoje.toISOString().split('T')[0];
    if (med.data_inicio && med.data_inicio > hoje_date) return false;
    if (med.data_fim && med.data_fim < hoje_date) return false;
    
    return true; // Medicação ativa com horários para hoje
  }).length;

  const compromissosHoje = (allAppointments?.filter(apt => {
    const dataApt = new Date(apt.data_agendamento);
    return dataApt.toDateString() === hoje.toDateString() && 
           ['agendado', 'confirmado'].includes(apt.status);
  }).length || 0) + medicacoesHoje;

  const proximaConsulta = consultas?.find(apt => new Date(apt.data_agendamento) > hoje);
  const proximoExame = exames?.find(apt => new Date(apt.data_agendamento) > hoje);

  const diasProximaConsulta = proximaConsulta ? 
    Math.ceil((new Date(proximaConsulta.data_agendamento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  const diasProximoExame = proximoExame ? 
    Math.ceil((new Date(proximoExame.data_agendamento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Calcular percentual de conquistas da semana
  const calcularPercentualConquistas = () => {
    if (!conquistasSemana) return 0;
    const { concluidos, planejados } = conquistasSemana;
    if (planejados === 0) return 0;
    return Math.round((concluidos / planejados) * 100);
  };

  const estatisticas = [{
    titulo: "Compromissos do Dia",
    valor: restantes.toString(),
    icone: Pill,
    cor: "success"
  }, {
    titulo: "Minhas Conquistas",
    valor: `${calcularPercentualConquistas()}%`,
    icone: TrendingUp,
    cor: "primary"
  }, {
    titulo: "Próxima Consulta",
    valor: diasProximaConsulta ? `${diasProximaConsulta} dias` : "Nenhuma",
    icone: User,
    cor: "accent"
  }, {
    titulo: "Próximo Exame",
    valor: diasProximoExame ? `${diasProximoExame} dias` : "Nenhum",
    icone: Stethoscope,
    cor: "muted"
  }];

  // Loading state with timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (medicationsLoading || appointmentsLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000); // 8 seconds timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [medicationsLoading, appointmentsLoading]);

  if ((medicationsLoading || appointmentsLoading) && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (loadingTimeout && (medicationsLoading || appointmentsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Conexão lenta detectada</div>
          <p className="text-muted-foreground">Os dados estão demorando para carregar</p>
          <div className="space-x-4">
            <Button 
              onClick={() => {
                setLoadingTimeout(false);
                refetchMedications?.();
                refetchAppointments?.();
              }}
              variant="outline"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => setLoadingTimeout(false)}
              variant="ghost"
            >
              Continuar Mesmo Assim
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {getGreetingByTime()}, {profile?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Márcio'}!
          </h1>
          <p className="text-muted-foreground">
            {(() => {
              const dateStr = new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              });
              return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            })()}
          </p>
        </div>
        <AddMedicationDialog>
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft h-12" aria-label="Adicionar nova medicação">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Adicionar Medicação</span>
          </Button>
        </AddMedicationDialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {estatisticas.map((stat, index) => {
          const isClickable = index === 0 || index === 1;
          const handleClick = () => {
            if (index === 0) {
              setIsDayModalOpen(true);
            } else if (index === 1) {
              navigate('/app/conquistas?periodo=semana');
            }
          };

          return (
            <Card 
              key={index} 
              className={`shadow-card hover:shadow-floating transition-shadow duration-300 ${
                isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''
              }`} 
              onClick={isClickable ? handleClick : undefined}
              aria-label={isClickable ? (index === 0 ? `Restantes ${restantes}, Total ${total}, Concluídos ${concluidos}` : `Ir para ${stat.titulo}`) : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.titulo}
                </CardTitle>
                <stat.icone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" aria-live={index === 0 ? "polite" : undefined}>{stat.valor}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Medicações */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximas Medicações
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/medicacoes')} aria-label="Ver todas as medicações">Ver Todas</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximasMedicacoes.length > 0 ? (
              proximasMedicacoes.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center">
                      <Pill className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{med.nome}</p>
                      <p className="text-sm text-muted-foreground">{med.dosagem}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatTime24h(typeof med.horario === 'string' ? med.horario : med.horario?.hora || 'N/A')}</p>
                    <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                      Pendente
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma medicação cadastrada</p>
                <p className="text-sm">Adicione sua primeira medicação</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Compromissos */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximos Compromissos
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/agenda')} aria-label="Ver agenda completa">Ver Agenda</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {compromissosProximos.length > 0 ? (
              compromissosProximos.map((apt, index) => {
                const dataFormatada = new Date(apt.data_agendamento).toLocaleDateString('pt-BR');
                const horaFormatada = formatTime24h(new Date(apt.data_agendamento).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', minute: '2-digit' 
                }));
                
                const getIconAndStyle = (tipo: string) => {
                  switch (tipo) {
                    case 'consulta':
                      return {
                        icon: User,
                        bgClass: 'bg-gradient-to-r from-consulta/5 to-consulta/10 border border-consulta/10',
                        iconBg: 'bg-consulta',
                        iconText: 'text-consulta-foreground'
                      };
                    case 'exame':
                      return {
                        icon: Stethoscope,
                        bgClass: 'bg-gradient-to-r from-exame/5 to-exame/10 border border-exame/10',
                        iconBg: 'bg-exame',
                        iconText: 'text-exame-foreground'
                      };
                    case 'atividade':
                      return {
                        icon: Heart,
                        bgClass: 'bg-gradient-to-r from-atividade/5 to-atividade/10 border border-atividade/10',
                        iconBg: 'bg-atividade',
                        iconText: 'text-white'
                      };
                    default:
                      return {
                        icon: Calendar,
                        bgClass: 'bg-gradient-to-r from-muted/5 to-muted/10 border border-muted/10',
                        iconBg: 'bg-muted',
                        iconText: 'text-muted-foreground'
                      };
                  }
                };

                const { icon: Icon, bgClass, iconBg, iconText } = getIconAndStyle(apt.tipo);

                return (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${bgClass}`}>
                    <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${iconText}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{apt.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.medico_profissional ? `${apt.medico_profissional} • ` : ''}
                        {dataFormatada} às {horaFormatada}
                      </p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {apt.tipo}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum compromisso próximo</p>
                <p className="text-sm">Agende seus compromissos na agenda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-primary">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AddMedicationDialog>
              <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-accent/20" aria-label="Adicionar nova medicação">
                <Pill className="w-6 h-6" />
                Registrar Medicação
              </Button>
            </AddMedicationDialog>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover:bg-accent/20" 
              onClick={() => {
                navigate('/app/agenda');
                window.scrollTo(0, 0);
              }}
              aria-label="Ir para agenda"
            >
              <Calendar className="w-6 h-6" />
              Agendar Compromisso
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover:bg-accent/20" 
              onClick={() => {
                navigate('/app/configuracoes?section=colaboradores');
                window.scrollTo(0, 0);
              }}
              aria-label="Gerenciar colaboradores"
            >
              <Users className="w-6 h-6" />
              Compartilhar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Compromissos do Dia */}
      <CompromissosModal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} />
    </div>
};

export default Dashboard;
