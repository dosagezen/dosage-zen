import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Check, User, Mail, Phone, Key, Users, CalendarIcon, Calendar as CalendarLucide } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import DeleteAccountDialog from "./DeleteAccountDialog";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface MyProfileData {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  celular: string;
  papel: string;
  isGestor: boolean;
  perfil: string;
  dataNascimento?: Date;
}

const MyProfileSection = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Simula o usuário logado
  const [profileData, setProfileData] = useState<MyProfileData>({
    id: "1",
    codigo: "X7M2A9",
    nome: "Maria Oliveira",
    email: "maria@email.com",
    celular: "(81) 98888-8888",
    papel: "paciente",
    isGestor: true,
    perfil: "Acompanhante",
    dataNascimento: new Date("1990-05-15")
  });

  const [formData, setFormData] = useState({
    nome: profileData.nome,
    email: profileData.email,
    celular: profileData.celular,
    senha: "",
    confirmarSenha: "",
    perfil: profileData.perfil,
    isGestor: profileData.isGestor,
    dataNascimento: profileData.dataNascimento
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estados para exclusão de conta
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    setFormData({
      nome: profileData.nome,
      email: profileData.email,
      celular: profileData.celular,
      senha: "",
      confirmarSenha: "",
      perfil: profileData.perfil,
      isGestor: profileData.isGestor,
      dataNascimento: profileData.dataNascimento
    });
    
    // Sincronizar inputValue com a data
    if (profileData.dataNascimento) {
      setInputValue(format(profileData.dataNascimento, "dd/MM/yyyy"));
      setCurrentMonth(profileData.dataNascimento);
    } else {
      setInputValue('');
      setCurrentMonth(new Date());
    }
  }, [profileData]);

  // Sincronizar inputValue quando formData.dataNascimento mudar
  useEffect(() => {
    if (formData.dataNascimento) {
      setInputValue(format(formData.dataNascimento, "dd/MM/yyyy"));
      setCurrentMonth(formData.dataNascimento);
    } else {
      setInputValue('');
    }
  }, [formData.dataNascimento]);

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCelular(e.target.value);
    setFormData({ ...formData, celular: formatted });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(profileData.codigo);
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "Código copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.celular.trim()) {
      newErrors.celular = "Celular é obrigatório";
    }

    if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Atualizar dados do perfil
    setProfileData(prev => ({
      ...prev,
      nome: formData.nome,
      email: formData.email,
      celular: formData.celular,
      perfil: formData.perfil,
      isGestor: formData.isGestor,
      dataNascimento: formData.dataNascimento
    }));

    setIsEditing(false);
    setFormData(prev => ({ ...prev, senha: "", confirmarSenha: "" }));
    
    toast({
      title: "Perfil atualizado",
      description: "Seus dados foram atualizados com sucesso.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      nome: profileData.nome,
      email: profileData.email,
      celular: profileData.celular,
      senha: "",
      confirmarSenha: "",
      perfil: profileData.perfil,
      isGestor: profileData.isGestor,
      dataNascimento: profileData.dataNascimento
    });
    setErrors({});
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    // Mock da exclusão da conta
    toast({
      title: "Conta excluída",
      description: "Sua conta foi excluída com sucesso. Redirecionando...",
      variant: "destructive"
    });
    
    // Simular redirecionamento para login após 2 segundos
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader className="pb-4 bg-accent/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 bg-gradient-primary">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                  {profileData.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  {profileData.nome}
                  {profileData.isGestor && (
                    <span className="text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2 py-1 rounded-full font-semibold">
                      Gestor
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {profileData.papel}
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary-hover w-full sm:w-auto"
              >
                <User className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Código do Usuário */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Código de Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Seu código único</p>
              <p className="font-semibold text-lg tracking-wide font-mono bg-slate-900 text-white px-2 py-1 rounded inline-block">
                {profileData.codigo}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Este código é único e imutável. Use-o para ser adicionado por outros usuários.
          </p>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              {/* Nova seção - 2 colunas: Perfil e Toggle */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
                {/* Campo Perfil */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="perfil" className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                    <Users className="w-4 h-4" />
                    Perfil
                  </Label>
                  <Select 
                    value={formData.perfil} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      perfil: value,
                      isGestor: value === "Cuidador" ? false : formData.isGestor 
                    })}
                  >
                    <SelectTrigger className="w-40 sm:w-44">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Acompanhante">Acompanhante</SelectItem>
                      <SelectItem value="Cuidador">Cuidador</SelectItem>
                      <SelectItem value="Paciente">Paciente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggle Gestor */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="gestorToggle" className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                    <User className="w-4 h-4" />
                    Gestor
                  </Label>
                  <Switch
                    id="gestorToggle"
                    checked={formData.isGestor}
                    disabled={formData.perfil === "Cuidador"}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGestor: checked })}
                  />
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome}</p>
                )}
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Celular */}
              <div className="space-y-2">
                <Label htmlFor="celular" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Celular
                </Label>
                <Input
                  id="celular"
                  value={formData.celular}
                  onChange={handleCelularChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={errors.celular ? "border-destructive" : ""}
                />
                {errors.celular && (
                  <p className="text-xs text-destructive">{errors.celular}</p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="dataNascimento" className="flex items-center gap-2">
                  <CalendarLucide className="w-4 h-4" />
                  Nascimento
                </Label>
                <div className="relative">
                  <Input
                    id="dataNascimento"
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={inputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      
                      // Remover tudo que não é número ou barra
                      let cleaned = value.replace(/[^\d\/]/g, '');
                      
                      // Aplicar máscara dd/mm/aaaa
                      if (cleaned.length >= 3 && cleaned.indexOf('/') === -1) {
                        cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                      }
                      if (cleaned.length >= 6 && cleaned.lastIndexOf('/') === 2) {
                        cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
                      }
                      if (cleaned.length > 10) {
                        cleaned = cleaned.slice(0, 10);
                      }
                      
                      // Atualizar inputValue imediatamente para mostrar o que o usuário está digitando
                      setInputValue(cleaned);
                      
                      // Validar e atualizar estado apenas se a data for válida e completa
                      if (cleaned.length === 10) {
                        try {
                          const parsedDate = parse(cleaned, "dd/MM/yyyy", new Date());
                          if (isValid(parsedDate) && 
                              parsedDate <= new Date() && 
                              parsedDate >= new Date("1900-01-01")) {
                            setFormData({ ...formData, dataNascimento: parsedDate });
                          }
                        } catch (error) {
                          console.warn("Data inválida:", cleaned);
                        }
                      } else if (cleaned.length === 0) {
                        setFormData({ ...formData, dataNascimento: undefined });
                      }
                    }}
                    className="pr-10"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        type="button"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        {/* Cabeçalho customizado com Ano e Mês */}
                        <div className="flex justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Ano
                            </Label>
                            <Select
                              value={currentMonth.getFullYear().toString()}
                              onValueChange={(year) => {
                                const newDate = new Date(parseInt(year), currentMonth.getMonth(), 1);
                                setCurrentMonth(newDate);
                                
                                if (formData.dataNascimento) {
                                  const updatedDate = new Date(parseInt(year), formData.dataNascimento.getMonth(), formData.dataNascimento.getDate());
                                  setFormData({ ...formData, dataNascimento: updatedDate });
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => {
                                  const year = new Date().getFullYear() - i;
                                  return (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Mês
                            </Label>
                            <Select
                              value={currentMonth.getMonth().toString()}
                              onValueChange={(month) => {
                                const newDate = new Date(currentMonth.getFullYear(), parseInt(month), 1);
                                setCurrentMonth(newDate);
                                
                                if (formData.dataNascimento) {
                                  const updatedDate = new Date(formData.dataNascimento.getFullYear(), parseInt(month), formData.dataNascimento.getDate());
                                  setFormData({ ...formData, dataNascimento: updatedDate });
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const monthName = format(new Date(2024, i, 1), "MMMM", { locale: ptBR });
                                  return (
                                    <SelectItem key={i} value={i.toString()}>
                                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Calendário */}
                        <Calendar
                          mode="single"
                          selected={formData.dataNascimento}
                          onSelect={(date) => setFormData({ ...formData, dataNascimento: date })}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          month={currentMonth}
                          locale={ptBR}
                          weekStartsOn={1}
                          className={cn("pointer-events-auto")}
                          classNames={{
                            caption: "hidden", // Esconder cabeçalho padrão
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center",
                            row: "flex w-full mt-2",
                            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md flex-1",
                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 mx-auto",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Nova Senha (opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Deixe em branco para manter a atual"
                    className={errors.senha ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-destructive">{errors.senha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              {formData.senha && (
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                      className={errors.confirmarSenha ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-xs text-destructive">{errors.confirmarSenha}</p>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover">
                  Salvar Alterações
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    Nome
                  </Label>
                  <p className="font-medium">{profileData.nome}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </Label>
                  <p className="font-medium">{profileData.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    Celular
                  </Label>
                  <p className="font-medium">{profileData.celular}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <CalendarLucide className="w-4 h-4" />
                    Nascimento
                  </Label>
                  <p className="font-medium">
                    {profileData.dataNascimento 
                      ? format(profileData.dataNascimento, "dd/MM/yyyy")
                      : "Não informado"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Exclusão de Conta */}
      <Card className="shadow-card border-destructive/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Para excluir seu perfil,{" "}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive/80 font-semibold underline focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:ring-offset-2"
              >
                clique aqui.
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteAccount}
      />

      <ConfirmDeleteDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmDelete}
        userCode={profileData.codigo}
      />
    </div>
  );
};

export default MyProfileSection;
