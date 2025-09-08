import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvitationData {
  email: string;
  first_name: string;
  last_name: string;
  user_code: string;
  expires_at: string;
}

export default function AdminSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const token = searchParams.get('token');

  // Password validation
  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    match: password === confirmPassword && password.length > 0
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const canSubmit = isPasswordValid && acceptTerms && invitationData;

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Token Inválido",
        description: "Link de convite inválido ou ausente."
      });
      navigate('/');
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);
      
      const response = await fetch(`https://pgbjqwdhtsinnaydijfj.supabase.co/functions/v1/admin-invite-validate?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error validating invitation:', data);
        toast({
          variant: "destructive",
          title: "Erro de Validação",
          description: "Erro ao validar convite. Tente novamente."
        });
        navigate('/');
        return;
      }

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Convite Inválido",
          description: data.error
        });
        navigate('/');
        return;
      }

      setInvitationData(data.invitation);
    } catch (error) {
      console.error('Error validating invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao validar convite."
      });
      navigate('/');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('admin-signup-accept', {
        body: {
          invite_token: token,
          password: password,
          password_confirm: confirmPassword
        }
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao processar convite. Tente novamente."
        });
        return;
      }

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error
        });
        return;
      }

      toast({
        title: "Bem-vindo!",
        description: "Seu acesso de Admin está ativo. Redirecionando..."
      });

      // Redirect to admin panel
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aceitar convite."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-muted-foreground">Validando convite...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Aceitar Convite Admin</CardTitle>
            <CardDescription>
              Complete sua conta de administrador para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Readonly Information */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <div className="text-sm font-medium">{invitationData.first_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sobrenome</Label>
                  <div className="text-sm font-medium">{invitationData.last_name}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                <div className="text-sm font-medium">{invitationData.email}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Código de Usuário</Label>
                <div className="text-sm font-bold tracking-wider text-primary">{invitationData.user_code}</div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Password Validation */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Requisitos da senha:</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    {passwordValidation.length ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={passwordValidation.length ? "text-success" : "text-muted-foreground"}>
                      Pelo menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {passwordValidation.uppercase ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={passwordValidation.uppercase ? "text-success" : "text-muted-foreground"}>
                      Uma letra maiúscula
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {passwordValidation.digit ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={passwordValidation.digit ? "text-success" : "text-muted-foreground"}>
                      Um dígito
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      {passwordValidation.match ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={passwordValidation.match ? "text-success" : "text-muted-foreground"}>
                        Senhas coincidem
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceito os{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    termos de uso
                  </a>{" "}
                  e{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    política de privacidade
                  </a>
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? "Criando conta..." : "Aceitar convite e Criar conta"}
            </Button>
          </form>

          {/* Expiration Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Este convite expira em{" "}
              {new Date(invitationData.expires_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}