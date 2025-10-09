import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { useTermsVersions } from "@/hooks/useTermsOfUse";

const TermosHistorico = () => {
  const { data: versions, isLoading } = useTermsVersions(20, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <Link to="/legal/termos-de-uso" className="hover:text-foreground transition-colors">
              Legal
            </Link>
            <span>/</span>
            <Link to="/legal/termos-de-uso" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <span>/</span>
            <span className="text-foreground">Histórico</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Histórico de Versões
              </h1>
              <p className="text-muted-foreground">
                Todas as versões dos Termos de Uso do DosageZen
              </p>
            </div>
            
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/legal/termos-de-uso">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="outline" asChild className="mb-6 md:hidden">
          <Link to="/legal/termos-de-uso">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Termos
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : versions && versions.length > 0 ? (
          <div className="space-y-4">
            {versions.map((version) => {
              const effectiveDate = new Date(version.effective_date).toLocaleDateString('pt-BR');
              const createdDate = new Date(version.created_at).toLocaleDateString('pt-BR');

              return (
                <Card key={version.id} className="p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">
                          Versão {version.version}
                        </h2>
                        {version.is_active && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ativa
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong className="text-foreground">Data de vigência:</strong> {effectiveDate}
                        </p>
                        <p>
                          <strong className="text-foreground">Criada em:</strong> {createdDate}
                        </p>
                      </div>
                    </div>

                    {version.is_active && (
                      <Button variant="default" asChild>
                        <Link to="/legal/termos-de-uso">
                          Ver Termos
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma versão encontrada</h2>
            <p className="text-muted-foreground">
              Não há histórico de versões disponível no momento.
            </p>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Para dúvidas sobre os Termos de Uso, entre em contato:{" "}
            <a 
              href="mailto:suporte@dosagezen.com.br" 
              className="text-primary hover:underline"
            >
              suporte@dosagezen.com.br
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TermosHistorico;
