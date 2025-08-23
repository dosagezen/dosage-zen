import { useState } from "react"
import { Plus, CalendarIcon, Clock, User, Stethoscope, Heart } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface AddCompromissoDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const AddCompromissoDialog = ({ children, open, onOpenChange }: AddCompromissoDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const [formData, setFormData] = useState({
    tipo: "",
    titulo: "",
    data: undefined as Date | undefined,
    horario: "",
    local: "",
    medico: "",
    observacoes: ""
  })

  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : isDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setIsDialogOpen

  const handleSave = () => {
    toast({
      title: "Compromisso adicionado",
      description: "O compromisso foi adicionado com sucesso à sua agenda.",
    })
    setDialogOpen(false)
    // Reset form
    setFormData({
      tipo: "",
      titulo: "",
      data: undefined,
      horario: "",
      local: "",
      medico: "",
      observacoes: ""
    })
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'consulta': return User
      case 'exame': return Stethoscope
      case 'atividade': return Heart
      default: return CalendarIcon
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
                Adicionar Compromisso
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Adicionar Compromisso
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Compromisso</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consulta">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Consulta
                  </div>
                </SelectItem>
                <SelectItem value="exame">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Exame
                  </div>
                </SelectItem>
                <SelectItem value="atividade">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Atividade
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input 
              id="titulo" 
              placeholder="Ex.: Consulta Cardiologia, Exame de Sangue, Fisioterapia"
              className="placeholder:text-muted-foreground/50"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                      !formData.data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data ? format(formData.data, "dd/MM/yyyy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal">Selecionar data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data}
                    onSelect={(date) => setFormData(prev => ({ ...prev, data: date }))}
                    initialFocus
                    locale={ptBR}
                    weekStartsOn={1}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário</Label>
              <div className="flex gap-2">
                <div className={`relative flex-1 time-input-container ${formData.horario ? 'has-value' : ''}`}>
                  <Input 
                    id="horario" 
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

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input 
              id="local" 
              placeholder="Ex.: Hospital Santa Casa, Clínica Médica, Academia"
              className="placeholder:text-muted-foreground/50"
              value={formData.local}
              onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
            />
          </div>

          {formData.tipo === 'consulta' && (
            <div className="space-y-2">
              <Label htmlFor="medico">Médico/Especialista</Label>
              <Input 
                id="medico" 
                placeholder="Ex.: Dr. João Silva"
                className="placeholder:text-muted-foreground/50"
                value={formData.medico}
                onChange={(e) => setFormData(prev => ({ ...prev, medico: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea 
              id="observacoes" 
              placeholder="Informações adicionais sobre o compromisso..."
              className="placeholder:text-muted-foreground/50 resize-none"
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={handleSave}>
            Salvar Compromisso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddCompromissoDialog