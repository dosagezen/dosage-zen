import { useState } from "react";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Step = "email" | "sucesso";

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [formData, setFormData] = useState({
    email: ""
  });
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

  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Tratamento específico de erros
        let errorMessage = error.message;
        
        if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        } else if (error.message.includes('not found')) {
          // Por segurança, não revelar se o email existe ou não
          errorMessage = "Se este e-mail estiver cadastrado, você receberá um link de recuperação.";
        }
        
        toast({
          title: "Atenção",
          description: errorMessage,
          variant: error.message.includes('not found') ? "default" : "destructive"
        });
        
        // Se não for erro crítico, mostrar tela de sucesso de qualquer forma
        // para não revelar se o email existe
        if (error.message.includes('not found')) {
          setCurrentStep("sucesso");
        }
        return;
      }
      
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada e spam. O link expira em 1 hora.",
      });
      
      setCurrentStep("sucesso");
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Não foi possível enviar o e-mail. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === "email") {
      return (
        <form onSubmit={handleEnviarEmail} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Digite seu e-mail para receber o link de recuperação
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
                Enviar Link de Recuperação
              </div>
            )}
          </Button>
        </form>
      );
    }

    if (currentStep === "sucesso") {
      return (
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-success">E-mail enviado!</h3>
            <p className="text-sm text-muted-foreground">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <p className="text-xs text-muted-foreground">
              Não esqueça de verificar a pasta de spam. O link expira em 1 hora.
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Após clicar no link do e-mail, você será redirecionado para criar uma nova senha.
            </p>
          </div>

          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            Voltar para Login
          </Button>
        </div>
      );
    }

    return null;
  };

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
            Recuperação de senha
          </p>
        </div>

        {/* Formulário */}
        <Card className="shadow-floating">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-primary">
              {currentStep === "email" ? "Esqueci a Senha" : "E-mail Enviado!"}
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

export default ForgotPassword;
