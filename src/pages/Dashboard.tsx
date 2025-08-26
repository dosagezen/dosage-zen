import { Calendar, Clock, Pill, Plus, TrendingUp, Users, User, Stethoscope, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import AddMedicationDialog from "@/components/AddMedicationDialog";
import CompromissosModal from "@/components/CompromissosModal";
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isAddCompromissoOpen, setIsAddCompromissoOpen] = useState(false);

  // Detectar parâmetro modal=compromissos para reabrir o modal
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'compromissos') {
      setIsDayModalOpen(true);
      // Limpar o parâmetro da URL
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);
  const proximasMedicacoes = [{
    nome: "Atorvastatina",
    dosagem: "10 mg",
    horario: "08:00",
    status: "próximo"
  }, {
    nome: "Metformina",
    dosagem: "500 mg",
    horario: "12:00",
    status: "pendente"
  }, {
    nome: "Losartana",
    dosagem: "50 mg",
    horario: "20:00",
    status: "pendente"
  }];
  const proximasConsultas = [{
    especialidade: "Cardiologia",
    medico: "Dr. João Silva",
    data: "15/05/2025",
    horario: "09:00"
  }, {
    especialidade: "Endocrinologia",
    medico: "Dra. Maria Santos",
    data: "22/05/2025",
    horario: "14:30"
  }];
  const estatisticas = [{
    titulo: "Compromissos Hoje",
    valor: "5",
    icone: Pill,
    cor: "success"
  }, {
    titulo: "Aderência Semanal",
    valor: "92%",
    icone: TrendingUp,
    cor: "primary"
  }, {
    titulo: "Próxima Consulta",
    valor: "3 dias",
    icone: User,
    cor: "accent"
  }, {
    titulo: "Próximo Exame",
    valor: "5 dias",
    icone: Stethoscope,
    cor: "muted"
  }];
  return <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">Bom dia, Sena!</h1>
          <p className="text-muted-foreground">Quinta-feira, 14 de agosto de 2025</p>
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
        {estatisticas.map((stat, index) => <Card key={index} className={`shadow-card hover:shadow-floating transition-shadow duration-300 ${index === 0 ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={index === 0 ? () => setIsDayModalOpen(true) : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.titulo}
              </CardTitle>
              <stat.icone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.valor}</div>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Medicações */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximas Medicações
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/medicacoes')} aria-label="Ver todas as medicações">Ver Todas</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximasMedicacoes.map((med, index) => <div key={index} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center">
                    <Pill className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{med.nome}</p>
                    <p className="text-sm text-muted-foreground">{med.dosagem}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{med.horario}</p>
                  <Badge variant={med.status === "próximo" ? "default" : "secondary"}>
                    {med.status === "próximo" ? "Próximo" : "Pendente"}
                  </Badge>
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Próximos Compromissos */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximos Compromissos
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/agenda')} aria-label="Ver agenda completa">Ver Agenda</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Consultas */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-consulta/5 to-consulta/10 border border-consulta/10">
              <div className="w-10 h-10 bg-consulta rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-consulta-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Cardiologia</p>
                <p className="text-sm text-muted-foreground">Dr. João Silva • 15/05/2025 às 09:00</p>
                <Badge variant="secondary" className="text-xs">Consulta</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-consulta/5 to-consulta/10 border border-consulta/10">
              <div className="w-10 h-10 bg-consulta rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-consulta-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Endocrinologia</p>
                <p className="text-sm text-muted-foreground">Dra. Maria Santos • 22/05/2025 às 14:30</p>
                <Badge variant="secondary" className="text-xs">Consulta</Badge>
              </div>
            </div>

            {/* Exames */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-exame/5 to-exame/10 border border-exame/10">
              <div className="w-10 h-10 bg-exame rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-exame-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Exame de Sangue</p>
                <p className="text-sm text-muted-foreground">Lab. Central • 16/05/2025 às 08:00</p>
                <Badge variant="secondary" className="text-xs">Exame</Badge>
              </div>
            </div>

            {/* Atividades */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-atividade/5 to-atividade/10 border border-atividade/10">
              <div className="w-10 h-10 bg-atividade rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-atividade-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Fisioterapia</p>
                <p className="text-sm text-muted-foreground">Clínica Vida • 17/05/2025 às 15:30</p>
                <Badge variant="secondary" className="text-xs">Atividade</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-atividade/5 to-atividade/10 border border-atividade/10">
              <div className="w-10 h-10 bg-atividade rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-atividade-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Caminhada</p>
                <p className="text-sm text-muted-foreground">Parque Central • 18/05/2025 às 07:00</p>
                <Badge variant="secondary" className="text-xs">Atividade</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-atividade/5 to-atividade/10 border border-atividade/10">
              <div className="w-10 h-10 bg-atividade rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-atividade-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Hidroginástica</p>
                <p className="text-sm text-muted-foreground">Academia Aqua • 19/05/2025 às 16:00</p>
                <Badge variant="secondary" className="text-xs">Atividade</Badge>
              </div>
            </div>
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
            <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-accent/20" onClick={() => navigate('/agenda')} aria-label="Ir para agenda">
              <Calendar className="w-6 h-6" />
              Agendar Compromisso
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-accent/20" onClick={() => navigate('/compartilhar')} aria-label="Compartilhar dados de saúde">
              <Users className="w-6 h-6" />
              Compartilhar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Compromissos do Dia */}
      <CompromissosModal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} />
    </div>;
};
export default Dashboard;