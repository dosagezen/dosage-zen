import { useState, useEffect } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    novaSenha: "",
    confirmarSenha: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validSession, setValidSession] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          toast({
            title: "Erro de autenticação",
            description: "Não foi possível verificar sua sessão. Tente novamente.",
            variant: "destructive"
          });
          setValidSession(false);
          setTimeout(() => navigate("/forgot-password"), 3000);
          return;
        }

        // Check if there's a valid recovery session
        if (!session) {
          toast({
            title: "Link inválido ou expirado",
            description: "Por favor, solicite um novo link de recuperação.",
            variant: "destructive"
          });
          setValidSession(false);
          setTimeout(() => navigate("/forgot-password"), 3000);
          return;
        }

        // Additional check: verify if this is actually a recovery session
        // by checking the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (type !== 'recovery' && !accessToken) {
          toast({
            title: "Link inválido",
            description: "Este não é um link válido de recuperação de senha.",
            variant: "destructive"
          });
          setValidSession(false);
          setTimeout(() => navigate("/forgot-password"), 3000);
          return;
        }

        setValidSession(true);
      } catch (error) {
        console.error('Erro inesperado ao verificar sessão:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro. Por favor, tente novamente.",
          variant: "destructive"
        });
        setValidSession(false);
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    };

    checkRecoverySession();
  }, [navigate, toast]);

  const validateForm = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.novaSenha
      });

      if (error) {
        // Tratamento específico de erros comuns
        let errorMessage = error.message;
        
        if (error.message.includes('token')) {
          errorMessage = "Sessão expirada. Solicite um novo link de recuperação.";
          setTimeout(() => navigate("/forgot-password"), 2000);
        } else if (error.message.includes('password')) {
          errorMessage = "A senha não atende aos requisitos de segurança.";
        }
        
        toast({
          title: "Erro ao alterar senha",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Fazer logout após alteração de senha por segurança
      await supabase.auth.signOut();

      toast({
        title: "Senha alterada com sucesso!",
        description: "Faça login com sua nova senha.",
      });
      
      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Aguardar validação da sessão
  if (validSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Verificando link...</p>
        </div>
      </div>
    );
  }

  // Se sessão inválida, mostrar mensagem
  if (validSession === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Link inválido ou expirado. Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">D</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">DosageZen</h1>
          <p className="text-muted-foreground mt-2">
            Redefinir senha
          </p>
        </div>

        {/* Formulário */}
        <Card className="shadow-floating">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-primary">
              {success ? "Sucesso!" : "Nova Senha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-success">Senha alterada com sucesso!</h3>
                  <p className="text-sm text-muted-foreground">
                    Sua senha foi redefinida. Redirecionando para o login...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use sua nova senha para fazer login.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">
                    Digite sua nova senha abaixo
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
                        placeholder="Mínimo 8 caracteres"
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
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
                        placeholder="Digite a senha novamente"
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
                        aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
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
                    "Salvar Nova Senha"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
