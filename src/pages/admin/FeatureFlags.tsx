import { useState } from "react";
import { Flag, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { featureFlags as initialFlags } from "@/data/adminMockData";

export function FeatureFlags() {
  const [flags, setFlags] = useState(initialFlags);
  const { toast } = useToast();

  const handleToggle = (key: string) => {
    setFlags(prev => 
      prev.map(flag => 
        flag.key === key 
          ? { ...flag, enabled: !flag.enabled }
          : flag
      )
    );

    const flag = flags.find(f => f.key === key);
    toast({
      title: "Feature Flag atualizada",
      description: `${flag?.name} ${!flag?.enabled ? 'ativada' : 'desativada'} (mock)`,
    });
  };

  const enabledCount = flags.filter(flag => flag.enabled).length;
  const disabledCount = flags.filter(flag => !flag.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Feature Flags</h2>
          <p className="text-muted-foreground">Controle as funcionalidades do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Mock - Sem persistência</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Flags</p>
                <p className="text-2xl font-semibold text-foreground">{flags.length}</p>
              </div>
              <Flag className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-semibold text-success">{enabledCount}</p>
              </div>
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Flag className="w-4 h-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativas</p>
                <p className="text-2xl font-semibold text-destructive">{disabledCount}</p>
              </div>
              <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Flag className="w-4 h-4 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Table */}
      <Card className="hover:shadow-soft transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">Flags Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flags.map((flag) => (
              <div 
                key={flag.key}
                className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-foreground">{flag.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={flag.enabled 
                        ? "bg-success/10 text-success border-success/20" 
                        : "bg-destructive/10 text-destructive border-destructive/20"
                      }
                    >
                      {flag.enabled ? 'ON' : 'OFF'}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{flag.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <div className="mt-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {flag.key}
                    </code>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {flag.enabled ? 'Ativada' : 'Desativada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mock - Sem persistência
                    </p>
                  </div>
                  <Switch 
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.key)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-muted bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Atenção - Modo Mock</h4>
              <p className="text-sm text-muted-foreground">
                Esta é uma implementação mock das feature flags. As alterações feitas aqui não são persistidas 
                e servem apenas para demonstração da interface. Em um ambiente real, estas flags seriam 
                armazenadas no banco de dados e afetariam o comportamento da aplicação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}