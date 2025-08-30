import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile, UserRole, UserStatus } from "./UserProfileManager";

interface UserProfileFormProps {
  user?: UserProfile | null;
  onSave: (userData: Omit<UserProfile, 'id' | 'created_at' | 'codigo'>) => void;
  onCancel: () => void;
}

export const UserProfileForm = ({ user, onSave, onCancel }: UserProfileFormProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    senha: "",
    confirmarSenha: "",
    papel: "acompanhante" as UserRole,
    status: "ativo" as UserStatus
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        celular: user.celular,
        senha: "",
        confirmarSenha: "",
        papel: user.papel,
        status: user.status
      });
    } else {
      // Reset para criação
      setFormData({
        nome: "",
        email: "",
        celular: "",
        senha: "",
        confirmarSenha: "",
        papel: "acompanhante",
        status: "ativo"
      });
    }
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Nome
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Celular
    const celularRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!formData.celular.trim()) {
      newErrors.celular = "Celular é obrigatório";
    } else if (!celularRegex.test(formData.celular)) {
      newErrors.celular = "Formato: (81) 98888-8888";
    }

    // Senha (apenas se não estiver editando ou se preencheu senha)
    if (!user || formData.senha) {
      if (!formData.senha) {
        newErrors.senha = "Senha é obrigatória";
      } else if (formData.senha.length < 8) {
        newErrors.senha = "Mínimo 8 caracteres";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
        newErrors.senha = "Deve conter maiúscula, minúscula e número";
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "Senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const userData = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      celular: formData.celular.trim(),
      papel: formData.papel,
      status: formData.status,
      owner_user_id: user?.owner_user_id
    };

    onSave(userData);
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleCelularChange = (value: string) => {
    const formatted = formatCelular(value);
    setFormData(prev => ({ ...prev, celular: formatted }));
  };

  const isEditing = !!user;

  return (
    <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-primary">
          {isEditing ? "Editar Perfil" : "Adicionar Perfil"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-foreground">Informações Básicas</h3>
            
            {/* Código do Usuário (somente na edição) */}
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Usuário</Label>
                <div className="relative">
                  <Input
                    id="codigo"
                    value={user?.codigo || ""}
                    readOnly
                    className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                    aria-label="Código do usuário"
                    aria-readonly="true"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-muted-foreground">
                      Único e imutável
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este código é único e não pode ser alterado.
                </p>
              </div>
            )}
            
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                placeholder="Ex.: Maria Oliveira"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex.: maria@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                placeholder="Ex.: (81) 98888-8888"
                value={formData.celular}
                onChange={(e) => handleCelularChange(e.target.value)}
                maxLength={15}
                className={errors.celular ? "border-destructive" : ""}
              />
              {errors.celular && (
                <p className="text-sm text-destructive">{errors.celular}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Senha */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-foreground">
              {isEditing ? "Alterar Senha (opcional)" : "Senha"}
            </h3>
            
            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">
                {isEditing ? "Nova Senha" : "Senha"}
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ex.: ********"
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  className={errors.senha ? "border-destructive pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.senha && (
                <p className="text-sm text-destructive">{errors.senha}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ex.: ********"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                  className={errors.confirmarSenha ? "border-destructive pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-sm text-destructive">{errors.confirmarSenha}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Papel e Status */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-foreground">Configurações</h3>
            
            {/* Papel */}
            <div className="space-y-3">
              <Label>Papel do Usuário</Label>
              <Select 
                value={formData.papel} 
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, papel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acompanhante">Acompanhante</SelectItem>
                  <SelectItem value="cuidador">Cuidador</SelectItem>
                  <SelectItem value="paciente" disabled={isEditing}>Paciente</SelectItem>
                  <SelectItem value="admin" disabled>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <Label>Status</Label>
              <RadioGroup 
                value={formData.status} 
                onValueChange={(value: UserStatus) => setFormData(prev => ({ ...prev, status: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ativo" id="ativo" />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inativo" id="inativo" />
                  <Label htmlFor="inativo">Inativo</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover"
          >
            {isEditing ? "Salvar Alterações" : "Criar Perfil"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};