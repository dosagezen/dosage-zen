import { useEffect } from "react";
import { usePrivacyPolicy, usePrivacyViewLog } from "@/hooks/usePrivacyPolicy";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TermsTableOfContents } from "@/components/TermsTableOfContents";
import { TermsSearchBar } from "@/components/TermsSearchBar";
import { TermsPrintButton } from "@/components/TermsPrintButton";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function PoliticaPrivacidade() {
  const { data: policy, isLoading, error } = usePrivacyPolicy();
  const logView = usePrivacyViewLog();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (policy?.id) {
      const logViewAsync = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        logView.mutate({
          policyId: policy.id,
          userId: user?.id
        });
      };
      logViewAsync();
    }
  }, [policy?.id]);

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error 
                ? "Erro ao carregar a Política de Privacidade. Por favor, tente novamente mais tarde."
                : "Política de Privacidade temporariamente indisponível."
              }
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(policy.effective_date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>Política de Privacidade — DosageZen | LGPD</title>
        <meta 
          name="description" 
          content="Saiba como o DosageZen protege seus dados pessoais e de saúde. Política em conformidade com LGPD, GDPR e CCPA." 
        />
        <meta property="og:title" content="Política de Privacidade — DosageZen" />
        <meta 
          property="og:description" 
          content="Transparência total sobre como coletamos, usamos e protegemos seus dados de saúde." 
        />
        <link rel="canonical" href={`${window.location.origin}/legal/politica-privacidade`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
          <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <TermsPrintButton />
              <Button asChild variant="outline" size="sm">
                <Link to="/legal/politica-privacidade/historico">
                  Histórico
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6 print:hidden" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
              <li>/</li>
              <li><span className="text-muted-foreground">Legal</span></li>
              <li>/</li>
              <li><span className="text-foreground font-medium">Política de Privacidade</span></li>
            </ol>
          </nav>

          {/* Alert Box */}
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 print:border print:border-border">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <strong>Proteção de Dados:</strong> O DosageZen respeita sua privacidade e protege seus dados conforme a LGPD, GDPR e CCPA.
            </AlertDescription>
          </Alert>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Table of Contents - Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start print:hidden">
              <TermsTableOfContents content={policy.content_md} />
            </aside>

            {/* Main Content Area */}
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="print:hidden">
                <TermsSearchBar onSearch={setSearchQuery} />
              </div>

              {/* Content Card */}
              <Card>
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl md:text-4xl font-bold">
                      Política de Privacidade — DosageZen
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>Versão: <strong>{policy.version}</strong></span>
                      <span>•</span>
                      <span>Vigência: <strong>{formattedDate}</strong></span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children, ...props }) => {
                        const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                        return (
                          <h2 id={id} className="scroll-mt-24" {...props}>
                            {children}
                          </h2>
                        );
                      },
                      h3: ({ children, ...props }) => {
                        const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                        return (
                          <h3 id={id} className="scroll-mt-24" {...props}>
                            {children}
                          </h3>
                        );
                      },
                      p: ({ children }) => {
                        const text = String(children);
                        return (
                          <p dangerouslySetInnerHTML={{ __html: highlightText(text) }} />
                        );
                      }
                    }}
                  >
                    {policy.content_md}
                  </ReactMarkdown>
                </CardContent>
              </Card>

              {/* Footer Navigation */}
              <Card className="print:hidden">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Dúvidas sobre privacidade?</p>
                      <a 
                        href="mailto:privacidade@dosagezen.com.br" 
                        className="text-primary hover:underline font-medium"
                      >
                        privacidade@dosagezen.com.br
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <Link to="/legal/termos-de-uso" className="text-muted-foreground hover:text-foreground transition-colors">
                        Termos de Uso
                      </Link>
                      <Link to="/legal/politica-privacidade/historico" className="text-muted-foreground hover:text-foreground transition-colors">
                        Histórico de Versões
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 py-8 print:hidden">
          <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} DosageZen. Todos os direitos reservados.</p>
            <p className="mt-2">Em conformidade com LGPD (Brasil), GDPR (UE) e CCPA (EUA).</p>
          </div>
        </footer>
      </div>
    </>
  );
}
