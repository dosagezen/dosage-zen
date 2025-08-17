import { useState } from "react";
import { ArrowLeft, Mail, Eye, EyeOff, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "codigo" | "nova-senha" | "sucesso";

const EsqueciSenha = () => {
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [formData, setFormData] = useState({
    email: "",
    codigo: "",
    novaSenha: "",
    confirmarSenha: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCodigo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = "Código é obrigatório";
    } else if (formData.codigo.length !== 6) {
      newErrors.codigo = "Código deve ter 6 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNovaSenha = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.novaSenha) {
      newErrors.novaSenha = "Nova senha é obrigatória";
    } else if (formData.novaSenha.length < 8) {
      newErrors.novaSenha = "Mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.novaSenha)) {
      newErrors.novaSenha = "Deve conter maiúscula, minúscula e número";
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      // Simular envio de email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "E-mail enviado",
        description: "Código de recuperação enviado para seu e-mail.",
      });
      
      setCurrentStep("codigo");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar e-mail. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCodigo()) return;

    setIsLoading(true);

    try {
      // Simular validação do código
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Código demo: 123456
      if (formData.codigo === "123456") {
        setCurrentStep("nova-senha");
      } else {
        toast({
          title: "Código inválido",
          description: "Código incorreto. Use 123456 para demonstração.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao validar código. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNovaSenha()) return;

    setIsLoading(true);

    try {
      // Simular alteração de senha
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep("sucesso");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "email":
        return (
          <form onSubmit={handleEnviarEmail} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Digite seu e-mail para receber o código de recuperação
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex.: usuario@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Enviar Código
                </div>
              )}
            </Button>
          </form>
        );

      case "codigo":
        return (
          <form onSubmit={handleValidarCodigo} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Digite o código enviado para <strong>{formData.email}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Verificação</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="000000"
                value={formData.codigo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(prev => ({ ...prev, codigo: value }));
                }}
                className={`text-center text-lg tracking-widest ${errors.codigo ? "border-destructive" : ""}`}
                disabled={isLoading}
                maxLength={6}
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">{errors.codigo}</p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Use <strong>123456</strong> para demonstração
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Validando...
                  </div>
                ) : (
                  "Validar Código"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setCurrentStep("email")}
              >
                Reenviar código
              </Button>
            </div>
          </form>
        );

      case "nova-senha":
        return (
          <form onSubmit={handleNovaSenha} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Código validado! Agora defina uma nova senha
              </p>
            </div>

            <div className="space-y-4">
              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="novaSenha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ex.: ********"
                    value={formData.novaSenha}
                    onChange={(e) => setFormData(prev => ({ ...prev, novaSenha: e.target.value }))}
                    className={errors.novaSenha ? "border-destructive pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.novaSenha && (
                  <p className="text-sm text-destructive">{errors.novaSenha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ex.: ********"
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                    className={errors.confirmarSenha ? "border-destructive pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.confirmarSenha && (
                  <p className="text-sm text-destructive">{errors.confirmarSenha}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Alterando...
                </div>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </form>
        );

      case "sucesso":
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-success">Senha alterada!</h3>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary-hover"
            >
              Fazer Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">D</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Dosage Zen</h1>
          <p className="text-muted-foreground mt-2">
            Recuperação de senha
          </p>
        </div>

        {/* Formulário */}
        <Card className="shadow-floating">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-primary">
              {currentStep === "email" && "Esqueci a Senha"}
              {currentStep === "codigo" && "Validar Código"}
              {currentStep === "nova-senha" && "Nova Senha"}
              {currentStep === "sucesso" && "Sucesso!"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            {/* Link para voltar ao login */}
            {currentStep !== "sucesso" && (
              <div className="text-center mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EsqueciSenha;