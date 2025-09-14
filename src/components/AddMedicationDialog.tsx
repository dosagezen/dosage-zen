import { useState, useEffect } from "react"
import { Plus, Trash2, CalendarIcon, Clock } from "lucide-react"
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

// Utility functions for handling dates without timezone issues
const parseLocalDate = (dateString: string): Date => {
  // Handle both 'YYYY-MM-DD' and ISO string formats
  const dateOnly = dateString.split('T')[0]
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}

const toYMD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido';
  completed_at?: string;
}

interface Medication {
  id: string
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
  medication?: any
  isEditing?: boolean
  onDelete?: (medicationId: string) => void
  onSave?: (medicationData: any) => void
  onUpdate?: (medicationData: any) => void
}

const AddMedicationDialog = ({ children, open, onOpenChange, medication, isEditing = false, onDelete, onSave, onUpdate }: AddMedicationDialogProps) => {
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

  // State for controlling date popover visibility (mobile auto-close)
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const [horarioError, setHorarioError] = useState("")

  // Atualizar dados quando medication muda ou dialog abre
  useEffect(() => {
    if (medication && isEditing) {
      console.log('Setting form data for editing medication:', medication)
      setFormData({
        status: medication.status === "ativa" || medication.status === "active" || medication.ativo === true,
        nome: medication.nome || "",
        dosagem: medication.dosagem || "",
        forma: medication.forma || "",
        frequencia: medication.frequencia || "",
        horario: medication.horaInicio || medication.horarios?.[0]?.hora || medication.horarios?.[0] || "",
        estoque: medication.estoque?.toString() || "",
        dataInicio: medication.data_inicio ? parseLocalDate(medication.data_inicio) : undefined,
        dataFim: medication.data_fim ? parseLocalDate(medication.data_fim) : undefined
      })
    } else if (!isEditing) {
      // Resetar formulário para nova medicação
      console.log('Resetting form data for new medication')
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
      setHorarioError("")
    }
  }, [medication, isEditing, open])

  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : isDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setIsDialogOpen

  const handleSave = () => {
    // Validação dos campos obrigatórios
    if (!formData.nome || !formData.dosagem || !formData.forma || !formData.frequencia) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    // Validação adicional para campos críticos
    if (!formData.horario) {
      toast({
        title: "Hora de início obrigatória",
        description: "Por favor, defina a hora de início da medicação.",
        variant: "destructive"
      })
      return
    }

    if (!formData.dataInicio) {
      toast({
        title: "Data de início obrigatória",
        description: "Por favor, defina quando a medicação deve começar.",
        variant: "destructive"
      })
      return
    }

    // Validação de datas
    if (formData.dataFim && formData.dataInicio && formData.dataFim < formData.dataInicio) {
      toast({
        title: "Data inválida",
        description: "A data de término não pode ser anterior à data de início.",
        variant: "destructive"
      })
      return
    }

    // Preparar dados para envio com diagnóstico
    const medicationData = {
      nome: formData.nome.trim(),
      dosagem: formData.dosagem.trim(),
      forma: formData.forma,
      frequencia: formData.frequencia,
      horarios: formData.horario ? [formData.horario] : [],
      estoque: parseInt(formData.estoque) || 0,
      ativo: formData.status,
      data_inicio: toYMD(formData.dataInicio), // Use timezone-safe conversion
      data_fim: formData.dataFim ? toYMD(formData.dataFim) : null,
      observacoes: null
    }

    // Log para diagnóstico
    console.log('Salvando medicação:', {
      med_id: isEditing ? medication?.id : 'novo',
      nome: medicationData.nome,
      start_date: medicationData.data_inicio,
      end_date: medicationData.data_fim,
      start_time: medicationData.horarios[0],
      frequency: medicationData.frequencia,
      tz_user: Intl.DateTimeFormat().resolvedOptions().timeZone,
      today_local: new Date().toLocaleDateString()
    })

    // Chamar a função apropriada
    if (isEditing && onUpdate) {
      onUpdate(medicationData)
    } else if (!isEditing && onSave) {
      onSave(medicationData)
    }
    
    // Fechar o dialog após chamar a função
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (medication && onDelete) {
      console.log('Deleting medication with ID:', medication.id)
      onDelete(medication.id)
      setDialogOpen(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditing ? "Editar Medicação" : "Nova Medicação"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Status Toggle */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label htmlFor="status">
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
              <SelectTrigger className="text-left">
                <SelectValue placeholder="Selecione (Ex.: 6 em 6 horas)" className="text-left" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4h">4 em 4 horas</SelectItem>
                <SelectItem value="6h">6 em 6 horas</SelectItem>
                <SelectItem value="8h">8 em 8 horas</SelectItem>
                <SelectItem value="12h">12 em 12 horas</SelectItem>
                <SelectItem value="24h">1 vez ao dia</SelectItem>
                <SelectItem value="12h_bis">2 vezes ao dia</SelectItem>
              </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicio">Hora de Início</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {isMobile ? (
                    // Mobile: usar seletor nativo
                    <Input 
                      id="inicio" 
                      type="time" 
                      value={formData.horario}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, horario: e.target.value }))
                        setHorarioError("")
                      }}
                      className={`w-full ${!formData.horario || formData.horario === ""
                        ? 'text-muted-foreground/50' 
                        : ''}`}
                    />
                  ) : (
                    // Desktop: permitir entrada manual
                    <div className="relative">
                      <Input 
                        id="inicio" 
                        type="text"
                        placeholder="hh:mm"
                        value={formData.horario}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData(prev => ({ ...prev, horario: value }))
                          
                          // Validação em tempo real para desktop
                          if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                            if (value.length >= 4) {
                              setHorarioError("Formato inválido. Use HH:mm")
                            }
                          } else {
                            setHorarioError("")
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value) {
                            // Tentar formatar automaticamente
                            const numbers = value.replace(/\D/g, '')
                            if (numbers.length === 3 || numbers.length === 4) {
                              const hours = numbers.slice(0, -2).padStart(2, '0')
                              const minutes = numbers.slice(-2)
                              const formatted = `${hours}:${minutes}`
                              
                              if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formatted)) {
                                setFormData(prev => ({ ...prev, horario: formatted }))
                                setHorarioError("")
                              } else {
                                setHorarioError("Formato inválido. Use HH:mm")
                              }
                            } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                              setHorarioError("Formato inválido. Use HH:mm")
                            }
                          }
                        }}
                        className={cn(
                          "w-full pr-10",
                          horarioError && "border-destructive focus-visible:ring-destructive",
                          !formData.horario && "text-muted-foreground/50"
                        )}
                      />
                      <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>
                {formData.horario && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, horario: "" }))
                      setHorarioError("")
                    }}
                    className="px-2"
                  >
                    ✕
                  </Button>
                )}
              </div>
              {horarioError && (
                <p className="text-sm text-destructive mt-1">{horarioError}</p>
              )}
              {!isMobile && !horarioError && (
                <p className="text-xs text-muted-foreground mt-1">Digite a hora no formato HH:mm</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data de Início</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
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
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, dataInicio: date }))
                      // Auto-close on mobile
                      if (isMobile) {
                        setIsStartDateOpen(false)
                      }
                    }}
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
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
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
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, dataFim: date }))
                      // Auto-close on mobile
                      if (isMobile) {
                        setIsEndDateOpen(false)
                      }
                    }}
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