import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Medication {
  id: number
  nome: string
  dosagem: string
  forma: string
  frequencia: string
  horarios: string[]
  proximaDose: string
  estoque: number
  status: string
}

interface AddMedicationDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  medication?: Medication
  isEditing?: boolean
}

const AddMedicationDialog = ({ children, open, onOpenChange, medication, isEditing = false }: AddMedicationDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    nome: medication?.nome || "",
    dosagem: medication?.dosagem || "",
    forma: medication?.forma || "",
    frequencia: medication?.frequencia || "",
    horario: medication?.horarios?.[0] || "",
    estoque: medication?.estoque?.toString() || ""
  })

  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : isDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setIsDialogOpen

  const handleSave = () => {
    toast({
      title: isEditing ? "Medicação atualizada" : "Medicação adicionada",
      description: isEditing 
        ? "A medicação foi atualizada com sucesso."
        : "A medicação foi adicionada com sucesso ao seu plano de tratamento.",
    })
    setDialogOpen(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Medicação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditing ? "Editar Medicação" : "Nova Medicação"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="medicamento">Nome do Medicamento</Label>
            <Input 
              id="medicamento" 
              placeholder="Ex.: Glifarge XR"
              className="placeholder:text-muted-foreground/50"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosagem">Dosagem</Label>
              <Input 
                id="dosagem" 
                placeholder="Ex.: 500 mg"
                className="placeholder:text-muted-foreground/50"
                value={formData.dosagem}
                onChange={(e) => setFormData(prev => ({ ...prev, dosagem: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input 
                id="quantidade" 
                placeholder="Ex.: 1"
                className="placeholder:text-muted-foreground/50"
                value={formData.estoque}
                onChange={(e) => setFormData(prev => ({ ...prev, estoque: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="forma">Forma</Label>
            <Select value={formData.forma} onValueChange={(value) => setFormData(prev => ({ ...prev, forma: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (Ex.: Comprimido)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprimido">Comprimido</SelectItem>
                <SelectItem value="capsula">Cápsula</SelectItem>
                <SelectItem value="liquido">Líquido</SelectItem>
                <SelectItem value="injecao">Injeção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequencia">Frequência</Label>
              <Select value={formData.frequencia} onValueChange={(value) => setFormData(prev => ({ ...prev, frequencia: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (Ex.: 6 em 6 horas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6h">6 em 6 horas</SelectItem>
                  <SelectItem value="8h">8 em 8 horas</SelectItem>
                  <SelectItem value="12h">12 em 12 horas</SelectItem>
                  <SelectItem value="24h">1 vez ao dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicio">Hora de Início</Label>
              <Input 
                id="inicio" 
                type="time" 
                placeholder="Ex.: 08:00"
                className="placeholder:text-muted-foreground/50"
                value={formData.horario}
                onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data de Início</Label>
              <Input 
                id="data-inicio" 
                type="date" 
                placeholder="Ex.: 14/08/2025"
                className="placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data do Término</Label>
              <Input 
                id="data-fim" 
                type="date" 
                placeholder="Ex.: 14/11/2025"
                className="placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={handleSave}>
            {isEditing ? "Atualizar Medicação" : "Salvar Medicação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddMedicationDialog