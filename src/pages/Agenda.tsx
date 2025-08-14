import { useState } from "react"
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Search, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const Agenda = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const consultas = [
    {
      id: 1,
      tipo: "consulta",
      especialidade: "Cardiologia",
      medico: "Dr. João Silva",
      local: "Hospital Central",
      data: "2025-05-15",
      dataFormatada: "15/05/2025",
      hora: "09:00",
      observacoes: "Levar resultados de exames anteriores",
      status: "agendado"
    },
    {
      id: 2,
      tipo: "exame",
      especialidade: "Endocrinologia",
      medico: "Dra. Maria Santos",
      local: "Clínica Saúde Plus",
      data: "2025-05-22",
      dataFormatada: "22/05/2025",
      hora: "14:30",
      observacoes: "Jejum de 12 horas",
      status: "agendado"
    },
    {
      id: 3,
      tipo: "consulta",
      especialidade: "Oftalmologia",
      medico: "Dr. Carlos Oliveira",
      local: "Centro Médico Visual",
      data: "2025-06-02",
      dataFormatada: "02/06/2025",
      hora: "16:00",
      observacoes: "",
      status: "agendado"
    }
  ]

  const filteredConsultas = consultas.filter(consulta =>
    consulta.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consulta.medico.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado": return "default"
      case "confirmado": return "default"
      case "cancelado": return "destructive"
      default: return "secondary"
    }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === "consulta" ? User : CalendarIcon
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Agenda</h1>
          <p className="text-muted-foreground">Gerencie suas consultas e exames</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft">
              <Plus className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-primary">Nova Consulta/Exame</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input 
                  id="especialidade" 
                  placeholder="Ex.: Oftalmologia"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medico">Médico/Profissional</Label>
                <Input 
                  id="medico" 
                  placeholder="Ex.: Dr. João Silva"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input 
                  id="local" 
                  placeholder="Ex.: Hospital Central"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input 
                    id="data" 
                    type="date" 
                    placeholder="Ex.: 22/09/2025"
                    className="placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input 
                    id="hora" 
                    type="time" 
                    placeholder="Ex.: 09:30"
                    className="placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Ex.: Levar resultados de exames anteriores"
                  className="placeholder:text-muted-foreground/50"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por especialidade ou médico..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Consultas/Exames */}
      <div className="grid gap-4">
        {filteredConsultas.map((consulta) => {
          const TipoIcon = getTipoIcon(consulta.tipo)
          return (
            <Card key={consulta.id} className="shadow-card hover:shadow-floating transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                      <TipoIcon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{consulta.especialidade}</h3>
                      <p className="text-muted-foreground">{consulta.medico}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{consulta.local}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="font-medium">{consulta.dataFormatada}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{consulta.hora}</span>
                    </div>
                    <div className="flex justify-end">
                      <Badge variant={getStatusColor(consulta.status)}>
                        {consulta.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {consulta.observacoes && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      <strong>Observações:</strong> {consulta.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      Remarcar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredConsultas.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta agendada"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Tente buscar com outros termos" 
                : "Agende sua primeira consulta para começar"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Próximos Lembretes */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Próximos Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
              <span className="text-primary">Consulta de Cardiologia em 3 dias</span>
              <Badge variant="outline">15/05/2025</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
              <span className="text-primary">Exame de Endocrinologia em 10 dias</span>
              <Badge variant="outline">22/05/2025</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Agenda