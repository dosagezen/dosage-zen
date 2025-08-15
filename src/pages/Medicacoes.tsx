import { useState } from "react"
import { Pill, Clock, Search, Check, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import AddMedicationDialog from "@/components/AddMedicationDialog"

const Medicacoes = () => {
  const medicacoes = [
    // Medicações para hoje (ativas) - 5 medicações
    {
      id: 1,
      nome: "Atorvastatina",
      dosagem: "10 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["08:00"],
      proximaDose: "08:00",
      estoque: 28,
      status: "ativa"
    },
    {
      id: 2,
      nome: "Metformina XR",
      dosagem: "500 mg",
      forma: "Comprimido",
      frequencia: "2x ao dia",
      horarios: ["08:00", "20:00"],
      proximaDose: "20:00",
      estoque: 15,
      status: "ativa"
    },
    {
      id: 3,
      nome: "Losartana",
      dosagem: "50 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["20:00"],
      proximaDose: "20:00",
      estoque: 5,
      status: "ativa"
    },
    {
      id: 4,
      nome: "Vitamina D3",
      dosagem: "2000 UI",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: ["12:00"],
      proximaDose: "12:00",
      estoque: 30,
      status: "ativa"
    },
    {
      id: 5,
      nome: "Ácido Acetilsalicílico",
      dosagem: "100 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["22:00"],
      proximaDose: "22:00",
      estoque: 20,
      status: "ativa"
    },
    // Medicações ativas mas não para hoje - mais 5 para completar 10 ativas
    {
      id: 6,
      nome: "Omeprazol",
      dosagem: "20 mg",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: ["07:00"],
      proximaDose: "07:00 (amanhã)",
      estoque: 12,
      status: "ativa"
    },
    {
      id: 7,
      nome: "Sinvastatina",
      dosagem: "40 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["21:00"],
      proximaDose: "21:00 (amanhã)",
      estoque: 22,
      status: "ativa"
    },
    {
      id: 8,
      nome: "Captopril",
      dosagem: "25 mg",
      forma: "Comprimido",
      frequencia: "3x ao dia",
      horarios: ["06:00", "14:00", "22:00"],
      proximaDose: "06:00 (amanhã)",
      estoque: 18,
      status: "ativa"
    },
    {
      id: 9,
      nome: "Hidroclorotiazida",
      dosagem: "25 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["08:00"],
      proximaDose: "08:00 (amanhã)",
      estoque: 14,
      status: "ativa"
    },
    {
      id: 10,
      nome: "Levotiroxina",
      dosagem: "50 mcg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["06:00"],
      proximaDose: "06:00 (amanhã)",
      estoque: 25,
      status: "ativa"
    },
    // Medicações inativas
    {
      id: 11,
      nome: "Amoxicilina",
      dosagem: "500 mg",
      forma: "Cápsula",
      frequencia: "3x ao dia",
      horarios: ["08:00", "16:00", "00:00"],
      proximaDose: "-",
      estoque: 0,
      status: "inativa"
    },
    {
      id: 12,
      nome: "Ibuprofeno",
      dosagem: "600 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: ["-"],
      proximaDose: "-",
      estoque: 8,
      status: "inativa"
    },
    {
      id: 13,
      nome: "Dipirona",
      dosagem: "500 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: ["-"],
      proximaDose: "-",
      estoque: 10,
      status: "inativa"
    },
    {
      id: 14,
      nome: "Prednisona",
      dosagem: "20 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["08:00"],
      proximaDose: "-",
      estoque: 3,
      status: "inativa"
    },
    {
      id: 15,
      nome: "Clonazepam",
      dosagem: "2 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: ["-"],
      proximaDose: "-",
      estoque: 5,
      status: "inativa"
    }
  ]

  const [searchTerm, setSearchTerm] = useState("")
  const [editingMedication, setEditingMedication] = useState<typeof medicacoes[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [medicacoesList, setMedicacoesList] = useState(medicacoes)
  const [registeredDoses, setRegisteredDoses] = useState<Set<number>>(new Set())
  const [activeFilter, setActiveFilter] = useState("hoje")

  // Função para verificar se uma medicação tem dose hoje
  const isToday = (proximaDose: string) => {
    // Simulação: considera "hoje" se não contém "(amanhã)" ou "-"
    return !proximaDose.includes("(amanhã)") && proximaDose !== "-"
  }

  // Função para extrair e converter horário para comparação
  const getTimeForSorting = (proximaDose: string) => {
    if (proximaDose === "-") return 9999; // Medicações inativas vão para o final
    if (proximaDose.includes("(amanhã)")) return 2400; // Medicações de amanhã vão após as de hoje
    
    // Extrair apenas o horário (formato HH:MM)
    const timeMatch = proximaDose.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      return hours * 60 + minutes; // Converter para minutos para facilitar comparação
    }
    
    return 9999; // Fallback para casos não previstos
  }

  // Aplicar filtro baseado na aba selecionada
  const getFilteredMedicacoes = () => {
    let filtered = medicacoesList
    
    switch (activeFilter) {
      case "hoje":
        filtered = medicacoesList.filter(med => 
          med.status === "ativa" && isToday(med.proximaDose)
        )
        break
      case "ativas":
        filtered = medicacoesList.filter(med => med.status === "ativa")
        break
      case "todas":
        filtered = medicacoesList
        break
      default:
        filtered = medicacoesList
    }
    
    // Ordenar por horário (ordem crescente)
    return filtered.sort((a, b) => {
      const timeA = getTimeForSorting(a.proximaDose)
      const timeB = getTimeForSorting(b.proximaDose)
      return timeA - timeB
    })
  }

  // Aplicar busca sobre o resultado filtrado
  const filteredMedicacoes = getFilteredMedicacoes().filter(med =>
    med.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteMedication = (medicationId: number) => {
    setMedicacoesList(prev => prev.filter(med => med.id !== medicationId))
  }

  const handleRegisterDose = (medicationId: number) => {
    setMedicacoesList(prev => prev.filter(med => med.id !== medicationId))
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Medicações</h1>
          <p className="text-muted-foreground">Gerencie suas medicações e horários</p>
        </div>
        <AddMedicationDialog />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4">
        <Filter className="h-5 w-5 text-muted-foreground" aria-label="Filtrar medicações" />
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="grid w-full grid-cols-3 h-[36px] items-center p-0 m-0">
            <TabsTrigger 
              value="hoje" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "hoje"}
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger 
              value="ativas" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "ativas"}
            >
              Ativas
            </TabsTrigger>
            <TabsTrigger 
              value="todas" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "todas"}
            >
              Todas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Busca */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar medicações..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de medicações */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <p className="text-sm">
          Você tem <span className="text-lg font-bold text-primary">{filteredMedicacoes.length.toString().padStart(2, '0')}</span> medicações listadas.
        </p>
      </div>

      {/* Lista de Medicações */}
      <div className="grid gap-4 w-full">
        {filteredMedicacoes.map((medicacao) => (
          <Card 
            key={medicacao.id} 
            className={`w-full shadow-card hover:shadow-floating transition-shadow duration-300 ${
              medicacao.status === "inativa" ? "bg-red-500 border-red-500" : ""
            }`}
          >
            <CardContent className="p-4 sm:p-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    medicacao.status === "inativa" ? "bg-red-600" : "bg-accent"
                  }`}>
                    <Pill className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      medicacao.status === "inativa" ? "text-white" : "text-accent-foreground"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base sm:text-lg font-semibold ${
                      medicacao.status === "inativa" ? "text-white" : "text-primary"
                    }`}>
                      {medicacao.nome}
                    </h3>
                    <p className={`text-sm sm:text-base ${
                      medicacao.status === "inativa" ? "text-red-100" : "text-muted-foreground"
                    }`}>
                      {medicacao.dosagem} • {medicacao.forma}
                    </p>
                    <p className={`text-xs sm:text-sm ${
                      medicacao.status === "inativa" ? "text-red-100" : "text-muted-foreground"
                    }`}>
                      {medicacao.frequencia}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
                  <div className={`flex items-center justify-start sm:justify-end ${
                    medicacao.status === "inativa" ? "text-white" : "text-primary"
                  }`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium text-sm sm:text-base">Próxima: {medicacao.proximaDose}</span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-end">
                    <Badge 
                      variant="outline"
                      className={`text-xs sm:text-sm ${medicacao.status === "inativa" ? "bg-red-600 text-white border-red-400" : ""}`}
                    >
                      {medicacao.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className={`mt-4 pt-4 border-t w-full ${
                medicacao.status === "inativa" ? "border-red-400/50" : "border-border/50"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm ${
                      medicacao.status === "inativa" ? "text-red-100" : "text-muted-foreground"
                    }`}>
                      Horários programados:
                    </p>
                    <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                      {medicacao.horarios.map((horario, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className={`text-xs sm:text-sm ${medicacao.status === "inativa" ? "bg-red-600 text-white" : "bg-accent/20"}`}
                        >
                          {horario}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end sm:ml-4">
                    <Button 
                      variant={medicacao.status === "inativa" ? "secondary" : "outline"}
                      size="sm"
                      className={`text-xs sm:text-sm flex-shrink-0 ${medicacao.status === "inativa" ? "bg-red-600 hover:bg-red-700 text-white border-red-400" : ""}`}
                      onClick={() => {
                        setEditingMedication(medicacao)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Alterar
                    </Button>
                    {medicacao.status === "ativa" && (
                      <button
                        onClick={() => handleRegisterDose(medicacao.id)}
                        className={`
                          w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0
                          ${registeredDoses.has(medicacao.id)
                            ? 'bg-[#588157] border-[#588157] text-white shadow-lg scale-105'
                            : 'bg-transparent border-muted-foreground/30 text-muted-foreground/70 hover:border-muted-foreground hover:text-muted-foreground'
                          }
                        `}
                        aria-label="Registrar dose"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMedicacoes.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {searchTerm ? "Nenhuma medicação encontrada" : "Nenhuma medicação cadastrada"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Tente buscar com outros termos" 
                : "Adicione sua primeira medicação para começar"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <AddMedicationDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        medication={editingMedication}
        isEditing={true}
        onDelete={handleDeleteMedication}
      />
    </div>
  )
}

export default Medicacoes