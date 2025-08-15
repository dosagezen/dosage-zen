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
    // Medicações para hoje (ativas)
    {
      id: 1,
      nome: "Atorvastatina",
      dosagem: "10 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["08:00"],
      proximaDose: "08:00",
      estoque: 28,
      status: "ativo"
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
      status: "ativo"
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
      status: "ativo"
    },
    // Medicações ativas mas não para hoje
    {
      id: 4,
      nome: "Omeprazol",
      dosagem: "20 mg",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: ["07:00"],
      proximaDose: "07:00 (amanhã)",
      estoque: 12,
      status: "ativo"
    },
    {
      id: 5,
      nome: "Sinvastatina",
      dosagem: "40 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: ["21:00"],
      proximaDose: "21:00 (amanhã)",
      estoque: 22,
      status: "ativo"
    },
    {
      id: 6,
      nome: "Captopril",
      dosagem: "25 mg",
      forma: "Comprimido",
      frequencia: "3x ao dia",
      horarios: ["06:00", "14:00", "22:00"],
      proximaDose: "06:00 (amanhã)",
      estoque: 18,
      status: "ativo"
    },
    // Medicações inativas
    {
      id: 7,
      nome: "Amoxicilina",
      dosagem: "500 mg",
      forma: "Cápsula",
      frequencia: "3x ao dia",
      horarios: ["08:00", "16:00", "00:00"],
      proximaDose: "-",
      estoque: 0,
      status: "inativo"
    },
    {
      id: 8,
      nome: "Ibuprofeno",
      dosagem: "600 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: ["-"],
      proximaDose: "-",
      estoque: 8,
      status: "inativo"
    },
    {
      id: 9,
      nome: "Dipirona",
      dosagem: "500 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: ["-"],
      proximaDose: "-",
      estoque: 10,
      status: "inativo"
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

  // Aplicar filtro baseado na aba selecionada
  const getFilteredMedicacoes = () => {
    let filtered = medicacoesList
    
    switch (activeFilter) {
      case "hoje":
        filtered = medicacoesList.filter(med => 
          med.status === "ativo" && isToday(med.proximaDose)
        )
        break
      case "ativas":
        filtered = medicacoesList.filter(med => med.status === "ativo")
        break
      case "todas":
        filtered = medicacoesList
        break
      default:
        filtered = medicacoesList
    }
    
    return filtered
  }

  // Aplicar busca sobre o resultado filtrado
  const filteredMedicacoes = getFilteredMedicacoes().filter(med =>
    med.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteMedication = (medicationId: number) => {
    setMedicacoesList(prev => prev.filter(med => med.id !== medicationId))
  }

  const handleRegisterDose = (medicationId: number) => {
    setRegisteredDoses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(medicationId)) {
        newSet.delete(medicationId)
      } else {
        newSet.add(medicationId)
      }
      return newSet
    })
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
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
          <TabsList className="grid w-full grid-cols-3 h-[36px] items-center p-0 m-0">
            <TabsTrigger 
              value="hoje" 
              className="data-[state=active]:bg-filter-active data-[state=active]:text-filter-active-foreground text-filter-neutral-foreground h-[36px] px-6 border-0 transition-all flex items-center justify-center"
              aria-selected={activeFilter === "hoje"}
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger 
              value="ativas" 
              className="data-[state=active]:bg-filter-active data-[state=active]:text-filter-active-foreground text-filter-neutral-foreground h-[36px] px-6 border-0 transition-all flex items-center justify-center"
              aria-selected={activeFilter === "ativas"}
            >
              Ativas
            </TabsTrigger>
            <TabsTrigger 
              value="todas" 
              className="data-[state=active]:bg-filter-active data-[state=active]:text-filter-active-foreground text-filter-neutral-foreground h-[36px] px-6 border-0 transition-all flex items-center justify-center"
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

      {/* Lista de Medicações */}
      <div className="grid gap-4">
        {filteredMedicacoes.map((medicacao) => (
          <Card key={medicacao.id} className="shadow-card hover:shadow-floating transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <Pill className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{medicacao.nome}</h3>
                    <p className="text-muted-foreground">{medicacao.dosagem} • {medicacao.forma}</p>
                    <p className="text-sm text-muted-foreground">{medicacao.frequencia}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center justify-end text-primary">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium whitespace-nowrap">Próxima: {medicacao.proximaDose}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Badge variant="outline">
                      {medicacao.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Horários programados:</p>
                    <div className="flex gap-2 mt-1">
                      {medicacao.horarios.map((horario, index) => (
                        <Badge key={index} variant="secondary" className="bg-accent/20">
                          {horario}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingMedication(medicacao)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    <button
                      onClick={() => handleRegisterDose(medicacao.id)}
                      className={`
                        w-9 h-9 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                        ${registeredDoses.has(medicacao.id)
                          ? 'bg-[#588157] border-[#588157] text-white shadow-lg scale-105'
                          : 'bg-transparent border-muted-foreground/30 text-muted-foreground/70 hover:border-muted-foreground hover:text-muted-foreground'
                        }
                      `}
                      aria-label="Registrar dose"
                    >
                      <Check className="w-4 h-4" />
                    </button>
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