import { useState } from "react";
import { Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { integrations as initialIntegrations } from "@/data/adminMockData";

const getStatusIcon = (enabled: boolean) => {
  if (enabled) {
    return <CheckCircle className="w-4 h-4 text-success" />;
  }
  return <XCircle className="w-4 h-4 text-destructive" />;
};

const getStatusBadge = (enabled: boolean) => {
  if (enabled) {
    return <Badge variant="secondary" className="bg-success/10 text-success">Ativo</Badge>;
  }
  return <Badge variant="secondary" className="bg-destructive/10 text-destructive">Inativo</Badge>;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'notification':
      return 'bg-vibrant-blue/10 text-vibrant-blue';
    case 'analytics':
      return 'bg-vibrant-purple/10 text-vibrant-purple';
    case 'monitoring':
      return 'bg-vibrant-yellow/10 text-vibrant-yellow';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function Integracoes() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const { toast } = useToast();

  const handleToggle = (key: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.key === key 
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
    
    toast({
      title: "Integração atualizada",
      description: "Mock - As alterações não são persistidas",
    });
  };

  const handleConfigure = (name: string) => {
    toast({
      title: "Configuração aberta",
      description: `Mock - Configurações de ${name}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Integrações</h2>
          <p className="text-muted-foreground">Gerencie as integrações externas do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Mock - Sem persistência</span>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.key} className="hover:shadow-soft transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{integration.name}</CardTitle>
                {getStatusIcon(integration.enabled)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTypeColor(integration.type)}>
                  {integration.type}
                </Badge>
                {getStatusBadge(integration.enabled)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Ativado</span>
                <Switch 
                  checked={integration.enabled}
                  onCheckedChange={() => handleToggle(integration.key)}
                />
              </div>

              {/* Configure Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleConfigure(integration.name)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurar {integration.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Chave da API</Label>
                      <Input 
                        id="api-key"
                        placeholder="••••••••••••••••••••••••••••••••"
                        value="sk_live_••••••••••••••••••••••••••••••••"
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">URL do Webhook</Label>
                      <Input 
                        id="webhook-url"
                        placeholder="https://api.dosagezen.com/webhooks/..."
                        value="https://api.dosagezen.com/webhooks/notifications"
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input 
                        id="timeout"
                        type="number"
                        placeholder="5000"
                        value="5000"
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Mock - Configurações apenas para visualização
                      </span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Integrações</p>
                <p className="text-2xl font-semibold text-foreground">{integrations.length}</p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-semibold text-success">
                  {integrations.filter(i => i.enabled).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativas</p>
                <p className="text-2xl font-semibold text-destructive">
                  {integrations.filter(i => !i.enabled).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}