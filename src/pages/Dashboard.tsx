import { Calendar, Clock, Pill, Plus, TrendingUp, Users, MapPin, Stethoscope, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import AddMedicationDialog from "@/components/AddMedicationDialog"

const Dashboard = () => {
  const navigate = useNavigate()
  const [isDayModalOpen, setIsDayModalOpen] = useState(false)
  
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

  // Dados mockados para o modal do dia
  const compromissosHoje = {
    medicacoes: [
      { id: 1, nome: "Atorvastatina", dosagem: "10 mg", hora: "08:00", status: "concluído", observacoes: "Tomar com água" },
      { id: 2, nome: "Metformina", dosagem: "500 mg", hora: "12:00", status: "pendente" },
      { id: 3, nome: "Losartana", dosagem: "50 mg", hora: "20:00", status: "pendente" },
      { id: 4, nome: "Vitamina D", dosagem: "2000 UI", hora: "08:00", status: "concluído" },
      { id: 5, nome: "Ômega 3", dosagem: "1000 mg", hora: "19:00", status: "pendente" }
    ],
    consultas: [
      { id: 1, especialidade: "Cardiologia", medico: "Dr. João Silva", hora: "09:00", local: "Hospital São Paulo", status: "agendado", observacoes: "Levar exames anteriores" }
    ],
    exames: [
      { id: 1, especialidade: "Hemograma Completo", medico: "Lab. Central", hora: "07:30", local: "Laboratório Central", status: "agendado", observacoes: "Jejum de 12h" }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluído": return "default"
      case "pendente": return "secondary"
      case "agendado": return "outline"
      default: return "secondary"
    }
  }

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
          <Card 
            key={index} 
            className={`shadow-card hover:shadow-floating transition-shadow duration-300 ${
              index === 0 ? 'cursor-pointer hover:scale-105 transition-transform' : ''
            }`}
            onClick={index === 0 ? () => setIsDayModalOpen(true) : undefined}
          >
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

      {/* Modal de Compromissos do Dia */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Compromissos de Hoje - 14 de agosto de 2025
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Medicações */}
            {compromissosHoje.medicacoes.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-success">
                  <Pill className="w-4 h-4" />
                  Medicações ({compromissosHoje.medicacoes.length})
                </h3>
                {compromissosHoje.medicacoes.map((medicacao) => (
                  <div key={medicacao.id} className="border border-success/20 bg-success/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">{medicacao.nome}</h4>
                        <p className="text-sm text-muted-foreground">{medicacao.dosagem}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{medicacao.hora}</span>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(medicacao.status)}>
                        {medicacao.status}
                      </Badge>
                    </div>
                    {medicacao.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {medicacao.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Consultas */}
            {compromissosHoje.consultas.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-primary">
                  <User className="w-4 h-4" />
                  Consultas ({compromissosHoje.consultas.length})
                </h3>
                {compromissosHoje.consultas.map((consulta) => (
                  <div key={consulta.id} className="border border-primary/20 bg-primary/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">{consulta.especialidade}</h4>
                        <p className="text-sm text-muted-foreground">{consulta.medico}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{consulta.hora}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{consulta.local}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(consulta.status)}>
                        {consulta.status}
                      </Badge>
                    </div>
                    {consulta.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {consulta.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Exames */}
            {compromissosHoje.exames.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-accent-foreground">
                  <Stethoscope className="w-4 h-4" />
                  Exames ({compromissosHoje.exames.length})
                </h3>
                {compromissosHoje.exames.map((exame) => (
                  <div key={exame.id} className="border border-accent/20 bg-accent/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">{exame.especialidade}</h4>
                        <p className="text-sm text-muted-foreground">{exame.medico}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{exame.hora}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{exame.local}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(exame.status)}>
                        {exame.status}
                      </Badge>
                    </div>
                    {exame.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {exame.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsDayModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard