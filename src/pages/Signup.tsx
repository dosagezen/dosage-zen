import { useState } from "react";
import { Eye, EyeOff, UserPlus, ArrowLeft, ChevronDown, ChevronUp, CreditCard, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    celular: "",
    senha: "",
    confirmarSenha: "",
    // Endereço (opcional)
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    // Pagamento (mock)
    numeroCartao: "",
    nomeCartao: "",
    validadeCartao: "",
    cvv: "",
    cpfTitular: "",
    billingCep: "",
    salvarCartao: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEndereco, setShowEndereco] = useState(false);
  const [showPagamento, setShowPagamento] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatarTelefone = (value: string) => {
    const numero = value.replace(/\D/g, '');
    if (numero.length <= 10) {
      return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarCartao = (value: string) => {
    const numero = value.replace(/\D/g, '');
    return numero.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatarValidade = (value: string) => {
    const numero = value.replace(/\D/g, '');
    if (numero.length >= 2) {
      return numero.replace(/(\d{2})(\d{2})/, '$1/$2');
    }
    return numero;
  };

  const formatarCPF = (value: string) => {
    const numero = value.replace(/\D/g, '');
    return numero.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCEP = (value: string) => {
    const numero = value.replace(/\D/g, '');
    return numero.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Nome completo
    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome completo é obrigatório";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Celular
    if (!formData.celular.trim()) {
      newErrors.celular = "Celular é obrigatório";
    }

    // Senha
    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória";
    } else if (formData.senha.length < 8) {
      newErrors.senha = "Mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = "Deve conter maiúscula, minúscula e número";
    }

    // Confirmar senha
    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    // Validações de pagamento (se preenchido)
    if (showPagamento && formData.numeroCartao) {
      if (formData.numeroCartao.replace(/\D/g, '').length !== 16) {
        newErrors.numeroCartao = "Número do cartão deve ter 16 dígitos";
      }

      if (!formData.nomeCartao.trim()) {
        newErrors.nomeCartao = "Nome no cartão é obrigatório";
      }

      if (!formData.validadeCartao || formData.validadeCartao.length !== 5) {
        newErrors.validadeCartao = "Validade inválida (MM/AA)";
      }

      if (!formData.cvv || formData.cvv.length !== 3) {
        newErrors.cvv = "CVV deve ter 3 dígitos";
      }

      if (!formData.cpfTitular || formData.cpfTitular.replace(/\D/g, '').length !== 11) {
        newErrors.cpfTitular = "CPF inválido";
      }

      if (!showEndereco && (!formData.billingCep || formData.billingCep.replace(/\D/g, '').length !== 8)) {
        newErrors.billingCep = "CEP para cobrança é obrigatório";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simular criação de conta
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const newUser = {
        nome: formData.nomeCompleto,
        email: formData.email,
        celular: formData.celular,
        papel: "paciente",
        plano: formData.numeroCartao ? "premium" : "gratuito"
      };

      // Simular armazenamento
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      toast({
        title: "Conta criada (mock)",
        description: `Bem-vindo(a), ${newUser.nome}! Redirecionando...`,
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePularPagamento = () => {
    setShowPagamento(false);
    setFormData(prev => ({
      ...prev,
      numeroCartao: "",
      nomeCartao: "",
      validadeCartao: "",
      cvv: "",
      cpfTitular: "",
      billingCep: "",
      salvarCartao: false
    }));
    
    toast({
      title: "Plano gratuito ativado (mock)",
      description: "Continue o cadastro sem informações de pagamento.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">D</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Dosage Zen</h1>
          <p className="text-muted-foreground mt-2">
            Crie sua conta para começar
          </p>
        </div>

        {/* Formulário de Cadastro */}
        <Card className="shadow-floating">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-primary">Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Seção: Dados do Usuário */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">Dados Pessoais</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomeCompleto">Nome Completo</Label>
                    <Input
                      id="nomeCompleto"
                      type="text"
                      placeholder="Ex.: Maria Oliveira"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                      className={errors.nomeCompleto ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.nomeCompleto && (
                      <p className="text-sm text-destructive">{errors.nomeCompleto}</p>
                    )}
                  </div>

                  {/* Email */}
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

                  {/* Celular */}
                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      type="tel"
                      placeholder="Ex.: (81) 98888-8888"
                      value={formData.celular}
                      onChange={(e) => {
                        const formatted = formatarTelefone(e.target.value);
                        setFormData(prev => ({ ...prev, celular: formatted }));
                      }}
                      className={errors.celular ? "border-destructive" : ""}
                      disabled={isLoading}
                      maxLength={15}
                    />
                    {errors.celular && (
                      <p className="text-sm text-destructive">{errors.celular}</p>
                    )}
                  </div>

                  {/* Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ex.: ********"
                        value={formData.senha}
                        onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                        className={errors.senha ? "border-destructive pr-10" : "pr-10"}
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
              </div>

              <Separator />

              {/* Seção: Endereço (Opcional) */}
              <div className="space-y-4">

                {showEndereco && (
                  <div id="endereco-section" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="rua">Rua</Label>
                      <Input
                        id="rua"
                        type="text"
                        placeholder="Ex.: Rua das Flores"
                        value={formData.rua}
                        onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        type="text"
                        placeholder="Ex.: 123"
                        value={formData.numero}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        type="text"
                        placeholder="Ex.: Apt 101"
                        value={formData.complemento}
                        onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        type="text"
                        placeholder="Ex.: Centro"
                        value={formData.bairro}
                        onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        type="text"
                        placeholder="Ex.: Recife"
                        value={formData.cidade}
                        onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uf">UF</Label>
                      <Input
                        id="uf"
                        type="text"
                        placeholder="Ex.: PE"
                        value={formData.uf}
                        onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                        disabled={isLoading}
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        type="text"
                        placeholder="Ex.: 50000-000"
                        value={formData.cep}
                        onChange={(e) => {
                          const formatted = formatarCEP(e.target.value);
                          setFormData(prev => ({ ...prev, cep: formatted }));
                        }}
                        disabled={isLoading}
                        maxLength={9}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Seção: Pagamento (Mock) */}
              {showPagamento && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-primary">Pagamento (Mock)</h3>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">⚠️</span>
                      <p className="text-sm text-muted-foreground">
                        <strong>Dados de cartão são MOCK</strong> — não serão enviados nem armazenados.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número do Cartão */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="numeroCartao">Número do Cartão</Label>
                      <Input
                        id="numeroCartao"
                        type="text"
                        placeholder="Ex.: 4111 1111 1111 1111"
                        value={formData.numeroCartao}
                        onChange={(e) => {
                          const formatted = formatarCartao(e.target.value);
                          if (formatted.replace(/\D/g, '').length <= 16) {
                            setFormData(prev => ({ ...prev, numeroCartao: formatted }));
                          }
                        }}
                        className={errors.numeroCartao ? "border-destructive" : ""}
                        disabled={isLoading}
                        maxLength={19}
                      />
                      {errors.numeroCartao && (
                        <p className="text-sm text-destructive">{errors.numeroCartao}</p>
                      )}
                    </div>

                    {/* Nome no Cartão */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nomeCartao">Nome Impresso no Cartão</Label>
                      <Input
                        id="nomeCartao"
                        type="text"
                        placeholder="Ex.: MARIA OLIVEIRA"
                        value={formData.nomeCartao}
                        onChange={(e) => setFormData(prev => ({ ...prev, nomeCartao: e.target.value.toUpperCase() }))}
                        className={errors.nomeCartao ? "border-destructive" : ""}
                        disabled={isLoading}
                      />
                      {errors.nomeCartao && (
                        <p className="text-sm text-destructive">{errors.nomeCartao}</p>
                      )}
                    </div>

                    {/* Validade */}
                    <div className="space-y-2">
                      <Label htmlFor="validadeCartao">Validade (MM/AA)</Label>
                      <Input
                        id="validadeCartao"
                        type="text"
                        placeholder="Ex.: 09/28"
                        value={formData.validadeCartao}
                        onChange={(e) => {
                          const formatted = formatarValidade(e.target.value);
                          setFormData(prev => ({ ...prev, validadeCartao: formatted }));
                        }}
                        className={errors.validadeCartao ? "border-destructive" : ""}
                        disabled={isLoading}
                        maxLength={5}
                      />
                      {errors.validadeCartao && (
                        <p className="text-sm text-destructive">{errors.validadeCartao}</p>
                      )}
                    </div>

                    {/* CVV */}
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="Ex.: 123"
                        value={formData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setFormData(prev => ({ ...prev, cvv: value }));
                        }}
                        className={errors.cvv ? "border-destructive" : ""}
                        disabled={isLoading}
                        maxLength={3}
                      />
                      {errors.cvv && (
                        <p className="text-sm text-destructive">{errors.cvv}</p>
                      )}
                    </div>

                    {/* CPF do Titular */}
                    <div className="space-y-2">
                      <Label htmlFor="cpfTitular">CPF do Titular</Label>
                      <Input
                        id="cpfTitular"
                        type="text"
                        placeholder="Ex.: 123.456.789-00"
                        value={formData.cpfTitular}
                        onChange={(e) => {
                          const formatted = formatarCPF(e.target.value);
                          if (formatted.replace(/\D/g, '').length <= 11) {
                            setFormData(prev => ({ ...prev, cpfTitular: formatted }));
                          }
                        }}
                        className={errors.cpfTitular ? "border-destructive" : ""}
                        disabled={isLoading}
                        maxLength={14}
                      />
                      {errors.cpfTitular && (
                        <p className="text-sm text-destructive">{errors.cpfTitular}</p>
                      )}
                    </div>

                    {/* CEP de Cobrança (só se endereço não foi preenchido) */}
                    {!showEndereco && (
                      <div className="space-y-2">
                        <Label htmlFor="billingCep">CEP para Cobrança</Label>
                        <Input
                          id="billingCep"
                          type="text"
                          placeholder="Ex.: 50000-000"
                          value={formData.billingCep}
                          onChange={(e) => {
                            const formatted = formatarCEP(e.target.value);
                            setFormData(prev => ({ ...prev, billingCep: formatted }));
                          }}
                          className={errors.billingCep ? "border-destructive" : ""}
                          disabled={isLoading}
                          maxLength={9}
                        />
                        {errors.billingCep && (
                          <p className="text-sm text-destructive">{errors.billingCep}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Checkbox Salvar Cartão */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="salvarCartao"
                      checked={formData.salvarCartao}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, salvarCartao: checked as boolean }))
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="salvarCartao"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Salvar cartão (mock - apenas visual)
                    </Label>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Criando conta...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Criar Conta
                    </div>
                  )}
                </Button>

              </div>
            </form>

            <Separator className="my-6" />

            {/* Link para Login */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm text-primary hover:text-primary-hover"
                  onClick={() => navigate("/login")}
                >
                  Fazer login
                </Button>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;