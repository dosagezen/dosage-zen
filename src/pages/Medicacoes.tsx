import { useState } from "react"
import { Pill, Clock, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import AddMedicationDialog from "@/components/AddMedicationDialog"

const Medicacoes = () => {
  const medicacoes = [
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
    }
  ]

  const [searchTerm, setSearchTerm] = useState("")
  const [editingMedication, setEditingMedication] = useState<typeof medicacoes[0] | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [medicacoesList, setMedicacoesList] = useState(medicacoes)
  const filteredMedicacoes = medicacoesList.filter(med =>
    med.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteMedication = (medicationId: number) => {
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

      {/* Filtros e Busca */}
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                    <Pill className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{medicacao.nome}</h3>
                    <p className="text-muted-foreground">{medicacao.dosagem} • {medicacao.forma}</p>
                    <p className="text-sm text-muted-foreground">{medicacao.frequencia}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium leading-none">Próxima: {medicacao.proximaDose}</span>
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
                    <Button variant="outline" size="sm">
                      Registrar Dose
                    </Button>
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