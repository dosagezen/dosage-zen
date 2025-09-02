import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  isActive: boolean;
  tier?: string;
  endDate?: string;
  customerPortalUrl?: string;
}

export const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({ isActive: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { toast } = useToast();
  const { profile, userRoles } = useAuth();

  // Verificar se o usuário atual é paciente
  const isPaciente = userRoles.some(role => role.role === 'paciente');

  useEffect(() => {
    if (isPaciente) {
      checkSubscriptionStatus();
    }
  }, [isPaciente]);

  const checkSubscriptionStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // TODO: Implementar verificação real com Stripe
      // Por enquanto, simulando dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSubscription: SubscriptionData = {
        isActive: Math.random() > 0.5, // 50% chance de estar ativo para demo
        tier: 'Premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      };
      
      setSubscription(mockSubscription);
      
    } catch (error) {
      toast({
        title: "Erro ao verificar assinatura",
        description: "Não foi possível verificar o status da assinatura.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implementar criação de checkout com Stripe
      toast({
        title: "Redirecionando para pagamento",
        description: "Você será direcionado para finalizar sua assinatura.",
      });
      
      // Simular redirecionamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Abrir Stripe Checkout em nova aba
      // window.open(checkoutUrl, '_blank');
      
    } catch (error) {
      toast({
        title: "Erro ao processar pagamento",
        description: "Erro ao criar sessão de pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implementar customer portal do Stripe
      toast({
        title: "Abrindo portal do cliente",
        description: "Você será direcionado para gerenciar sua assinatura.",
      });
      
      // Simular portal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Abrir Customer Portal em nova aba
      // window.open(subscription.customerPortalUrl, '_blank');
      
    } catch (error) {
      toast({
        title: "Erro ao abrir portal",
        description: "Erro ao acessar o portal de gerenciamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPaciente) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Assinatura
          </CardTitle>
          <CardDescription>
            Apenas perfis de Paciente possuem assinatura própria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você está colaborando como {userRoles[0]?.role}. 
              A assinatura está vinculada ao paciente principal.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Assinatura
          <Button
            variant="ghost"
            size="sm"
            onClick={checkSubscriptionStatus}
            disabled={isRefreshing}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Gerencie sua assinatura e plano atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.isActive ? (
          <>
            {/* Assinatura ativa */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="bg-primary">
                    Ativo
                  </Badge>
                  {subscription.tier && (
                    <Badge variant="outline">
                      {subscription.tier}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.endDate && (
                    <>Renovação em {new Date(subscription.endDate).toLocaleDateString('pt-BR')}</>
                  )}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>

            {/* Benefícios da assinatura */}
            <div className="space-y-2">
              <h4 className="font-medium">Benefícios inclusos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Lembretes ilimitados de medicação</li>
                <li>✅ Gestão completa de consultas e exames</li>
                <li>✅ Convite para colaboradores</li>
                <li>✅ Histórico completo e relatórios</li>
                <li>✅ Suporte prioritário</li>
              </ul>
            </div>

            <Button 
              onClick={handleManageSubscription}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Assinatura
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Assinatura inativa */}
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div>
                <Badge variant="destructive">
                  Inativo
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Assine para acessar todos os recursos
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            {/* Planos disponíveis */}
            <div className="space-y-3">
              <h4 className="font-medium">Plano Premium - R$ 19,90/mês</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Todos os recursos do DosageZen</li>
                <li>✅ Lembretes personalizados</li>
                <li>✅ Colaboradores ilimitados</li>
                <li>✅ Relatórios detalhados</li>
                <li>✅ Suporte prioritário</li>
              </ul>
            </div>

            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Assinar Agora
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};