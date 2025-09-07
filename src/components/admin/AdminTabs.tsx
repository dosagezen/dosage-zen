import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VisaoGeral } from "@/pages/admin/VisaoGeral";
import { RelatoriosProduto } from "@/pages/admin/RelatoriosProduto";
import { Integracoes } from "@/pages/admin/Integracoes";
import { Catalogos } from "@/pages/admin/Catalogos";
import { FeatureFlags } from "@/pages/admin/FeatureFlags";
import { Observabilidade } from "@/pages/admin/Observabilidade";
import { Usuarios } from "@/pages/admin/Usuarios";

export function AdminTabs() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="visao-geral" className="w-full">
        <div className="border-b border-border/50 pb-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto p-1">
            <TabsTrigger value="visao-geral" className="text-xs md:text-sm">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="text-xs md:text-sm">
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="text-xs md:text-sm">
              Integrações
            </TabsTrigger>
            <TabsTrigger value="catalogos" className="text-xs md:text-sm">
              Catálogos
            </TabsTrigger>
            <TabsTrigger value="feature-flags" className="text-xs md:text-sm">
              Features
            </TabsTrigger>
            <TabsTrigger value="observabilidade" className="text-xs md:text-sm">
              Logs
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="text-xs md:text-sm">
              Usuários
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visao-geral">
          <VisaoGeral />
        </TabsContent>
        
        <TabsContent value="relatorios">
          <RelatoriosProduto />
        </TabsContent>
        
        <TabsContent value="integracoes">
          <Integracoes />
        </TabsContent>
        
        <TabsContent value="catalogos">
          <Catalogos />
        </TabsContent>
        
        <TabsContent value="feature-flags">
          <FeatureFlags />
        </TabsContent>
        
        <TabsContent value="observabilidade">
          <Observabilidade />
        </TabsContent>
        
        <TabsContent value="usuarios">
          <Usuarios />
        </TabsContent>
      </Tabs>
    </div>
  );
}