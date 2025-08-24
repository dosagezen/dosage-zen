import { useState, useEffect } from "react"
import { Plus, Trash2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido';
  completed_at?: string;
}

interface Medication {
  id: number
  nome: string
  dosagem: string
  forma: string
  frequencia: string
  horarios: HorarioStatus[]
  proximaDose: string
  estoque: number
  status: string
}

interface AddMedicationDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  medication?: Medication | null
  isEditing?: boolean
  onDelete?: (medicationId: number) => void
}

const AddMedicationDialog = ({ children, open, onOpenChange, medication, isEditing = false, onDelete }: AddMedicationDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const [formData, setFormData] = useState({
    status: true, // true = ativa, false = inativa
    nome: "",
    dosagem: "",
    forma: "",
    frequencia: "",
    horario: "",
    estoque: "",
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined
  })

  // Atualizar dados quando medication muda
  useEffect(() => {
    if (medication && isEditing) {
      setFormData({
        status: medication.status === "ativa" || medication.status === "active" || !medication.status ? true : false,
        nome: medication.nome || "",
        dosagem: medication.dosagem || "",
        forma: medication.forma || "",
        frequencia: medication.frequencia || "",
        horario: medication.horarios?.[0]?.hora || "",
        estoque: medication.estoque?.toString() || "",
        dataInicio: undefined,
        dataFim: undefined
      })
    } else {
      // Resetar formulário para nova medicação
      setFormData({
        status: true, // Nova medicação inicia como ativa
        nome: "",
        dosagem: "",
        forma: "",
        frequencia: "",
        horario: "",
        estoque: "",
        dataInicio: undefined,
        dataFim: undefined
      })
    }
  }, [medication, isEditing])

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

  const handleDelete = () => {
    if (medication && onDelete) {
      onDelete(medication.id)
      toast({
        title: "Medicação excluída",
        description: "A medicação foi removida com sucesso.",
        variant: "destructive"
      })
      setDialogOpen(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px]">
            {isMobile ? (
              <Plus className="w-4 h-4" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Medicação
              </>
            )}
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
          {/* Status Toggle */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label>
              Medicação Ativa
            </Label>
            <button
              type="button"
              role="switch"
              aria-checked={formData.status}
              aria-label="Status da medicação"
              onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
              className={cn(
                "relative inline-flex h-8 w-16 items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                formData.status 
                  ? "bg-[hsl(146,29%,31%)] border-[hsl(146,29%,31%)]" // #344E41
                  : "bg-[hsl(58,19%,84%)] border-[hsl(58,19%,84%)]" // #DAD7CD
              )}
            >
              <span
                className={cn(
                  "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm",
                  formData.status ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
            <div 
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                formData.status
                  ? "bg-[hsl(140,36%,42%)] text-white" // #588157 - sucesso
                  : "bg-[hsl(0,65%,51%)] text-white" // Vermelho para inativa
              )}
              aria-live="polite"
              aria-label={`Medicação marcada como ${formData.status ? 'ATIVA' : 'INATIVA'}`}
            >
              {formData.status ? 'ATIVA' : 'INATIVA'}
            </div>
          </div>
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
              <div className="flex gap-2">
                <div className={`relative flex-1 time-input-container ${formData.horario ? 'has-value' : ''}`}>
                  <Input 
                    id="inicio" 
                    type="time" 
                    value={formData.horario}
                    onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
                    className={`w-full ${!formData.horario || formData.horario === ""
                      ? 'text-muted-foreground/50' 
                      : ''}`}
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                </div>
                {formData.horario && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, horario: "" }))}
                    className="px-2"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                      !formData.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataInicio ? format(formData.dataInicio, "dd/MM/yy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal text-base md:text-sm">14/08/25</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dataInicio}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dataInicio: date }))}
                    initialFocus
                    locale={ptBR}
                    weekStartsOn={1}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data do Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                      !formData.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataFim ? format(formData.dataFim, "dd/MM/yy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal text-base md:text-sm">14/11/25</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dataFim}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dataFim: date }))}
                    initialFocus
                    locale={ptBR}
                    weekStartsOn={1}
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => 
                      formData.dataInicio ? date < formData.dataInicio : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={handleSave}>
              {isEditing ? "Atualizar Medicação" : "Salvar Medicação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddMedicationDialog