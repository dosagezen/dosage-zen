import { usePrivacyVersions } from "@/hooks/usePrivacyPolicy";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function PoliticaPrivacidadeHistorico() {
  const { data: versions, isLoading, error } = usePrivacyVersions(20, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar o histórico de versões. Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/legal/politica-privacidade">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar à Política de Privacidade
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Histórico de Versões — Política de Privacidade | DosageZen</title>
        <meta 
          name="description" 
          content="Histórico completo de todas as versões da Política de Privacidade do DosageZen." 
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/legal/politica-privacidade">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar à Política de Privacidade
              </Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
              <li>/</li>
              <li><span className="text-muted-foreground">Legal</span></li>
              <li>/</li>
              <li><Link to="/legal/politica-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
              <li>/</li>
              <li><span className="text-foreground font-medium">Histórico</span></li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Histórico de Versões
            </h1>
            <p className="text-muted-foreground">
              Todas as versões da Política de Privacidade do DosageZen
            </p>
          </div>

          {/* Versions List */}
          {versions && versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version) => {
                const formattedDate = new Date(version.effective_date).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                
                const createdDate = new Date(version.created_at).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <Card key={version.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-xl">
                              Versão {version.version}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Vigência: {formattedDate}
                            </p>
                          </div>
                        </div>
                        {version.is_active && (
                          <Badge variant="default">Ativa</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Criada em: {createdDate}
                        </span>
                        {version.is_active && (
                          <Button asChild size="sm">
                            <Link to="/legal/politica-privacidade">
                              Ver Política Atual
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma versão encontrada.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <Alert className="mt-8">
            <AlertDescription>
              <strong>Nota:</strong> Todas as alterações na Política de Privacidade são registradas e mantidas para fins de transparência e auditoria. Alterações significativas serão comunicadas aos usuários por e-mail.
            </AlertDescription>
          </Alert>
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 py-8">
          <div className="container max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} DosageZen. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
