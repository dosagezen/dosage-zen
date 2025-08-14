import { Calendar, Clock, Pill, Plus, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import AddMedicationDialog from "@/components/AddMedicationDialog"

const Dashboard = () => {
  const navigate = useNavigate()
  const proximasMedicacoes = [
    { nome: "Atorvastatina", dosagem: "10 mg", horario: "08:00", status: "próximo" },
    { nome: "Metformina", dosagem: "500 mg", horario: "12:00", status: "pendente" },
    { nome: "Losartana", dosagem: "50 mg", horario: "20:00", status: "pendente" }
  ]

  const proximasConsultas = [
    { especialidade: "Cardiologia", medico: "Dr. João Silva", data: "15/05/2025", horario: "09:00" },
    { especialidade: "Endocrinologia", medico: "Dra. Maria Santos", data: "22/05/2025", horario: "14:30" }
  ]

  const estatisticas = [
    { titulo: "Medicações Hoje", valor: "5", icone: Pill, cor: "success" },
    { titulo: "Próxima Consulta", valor: "3 dias", icone: Calendar, cor: "accent" },
    { titulo: "Aderência Semanal", valor: "92%", icone: TrendingUp, cor: "primary" },
    { titulo: "Cuidadores", valor: "2", icone: Users, cor: "muted" }
  ]

  return (
    <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Bom dia, Maria!</h1>
          <p className="text-muted-foreground">Hoje é quinta-feira, 14 de agosto de 2025</p>
        </div>
        <AddMedicationDialog>
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Medicação
          </Button>
        </AddMedicationDialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {estatisticas.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-floating transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.titulo}
              </CardTitle>
              <stat.icone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Medicações */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximas Medicações
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/medicacoes')}>Ver Todas</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximasMedicacoes.map((med, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
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
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximas Consultas */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Consultas
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/agenda')}>Ver Agenda</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximasConsultas.map((consulta, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{consulta.especialidade}</p>
                    <p className="text-sm text-muted-foreground">{consulta.medico}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{consulta.data}</p>
                  <p className="text-sm text-muted-foreground">{consulta.horario}</p>
                </div>
              </div>
            ))}
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
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover:bg-accent/20"
              onClick={() => navigate('/medicacoes')}
            >
              <Pill className="w-6 h-6" />
              Registrar Dose
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover:bg-accent/20"
              onClick={() => navigate('/agenda')}
            >
              <Calendar className="w-6 h-6" />
              Agendar Consulta
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover:bg-accent/20"
              onClick={() => navigate('/compartilhar')}
            >
              <Users className="w-6 h-6" />
              Compartilhar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard