import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { AlertTriangle, Home, FileText, Copy, Check } from "lucide-react";
import { TermsTableOfContents } from "@/components/TermsTableOfContents";
import { TermsSearchBar } from "@/components/TermsSearchBar";
import { TermsPrintButton } from "@/components/TermsPrintButton";
import { useTermsOfUse } from "@/hooks/useTermsOfUse";
import { useTermsViewLog } from "@/hooks/useTermsAcceptance";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TermosDeUso = () => {
  const { data: terms, isLoading, error } = useTermsOfUse();
  const { mutate: logView } = useTermsViewLog();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Termos de Uso — DosageZen";
  }, []);

  useEffect(() => {
    if (terms?.id) {
      logView({ termsId: terms.id, userId: user?.id });
    }
  }, [terms?.id, user?.id, logView]);

  const sections = useMemo(() => {
    if (!terms?.content_md) return [];
    
    const lines = terms.content_md.split('\n');
    const extractedSections: Array<{ id: string; title: string; content: string }> = [];
    let currentSection: { id: string; title: string; content: string } | null = null;
    let sectionIndex = 0;

    lines.forEach((line) => {
      const match = line.match(/^##\s+(.+)$/);
      if (match) {
        if (currentSection) {
          extractedSections.push(currentSection);
        }
        const title = match[1];
        const id = `section-${sectionIndex++}`;
        currentSection = { id, title, content: line + '\n' };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection) {
      extractedSections.push(currentSection);
    }

    return extractedSections;
  }, [terms?.content_md]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
  };

  const copyLinkToSection = (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedSection(sectionId);
    toast({
      title: "Link copiado!",
      description: "O link desta seção foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !terms) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Termos Indisponíveis</h1>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os Termos de Uso no momento. Por favor, tente novamente mais tarde.
          </p>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const effectiveDate = new Date(terms.effective_date).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <span>Legal</span>
            <span>/</span>
            <span className="text-foreground">Termos de Uso</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Termos de Uso — DosageZen
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {effectiveDate} • Versão {terms.version}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <TermsPrintButton />
              <Button variant="outline" size="sm" asChild>
                <Link to="/legal/termos-de-uso/historico">
                  <FileText className="h-4 w-4 mr-2" />
                  Histórico
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex justify-center md:justify-start">
          <TermsSearchBar onSearch={setSearchQuery} />
        </div>

        {/* Alert */}
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            <strong>Aviso Legal:</strong> O DosageZen não substitui consulta, diagnóstico ou prescrição médica. 
            Sempre consulte profissionais de saúde qualificados.
          </AlertDescription>
        </Alert>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - TOC */}
          <aside className="hidden lg:block lg:col-span-1">
            <TermsTableOfContents content={terms.content_md} />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Card className="p-6 md:p-8">
              <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="space-y-4">
                {filteredSections.map((section) => (
                  <AccordionItem key={section.id} value={section.id} id={section.id}>
                    <div className="flex items-center gap-2 group">
                      <AccordionTrigger className="flex-1 text-left hover:no-underline">
                        <h2 className="text-xl font-semibold text-foreground">
                          {section.title}
                        </h2>
                      </AccordionTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLinkToSection(section.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copiar link desta seção"
                      >
                        {copiedSection === section.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <AccordionContent>
                      <Separator className="my-4" />
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(
                            section.content.replace(/^##\s+.+$/m, '')
                          )
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredSections.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhuma seção encontrada para "{searchQuery}"
                  </p>
                </div>
              )}
            </Card>
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <Link to="/legal/politica-privacidade" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <span>•</span>
              <a href="mailto:suporte@dosagezen.com.br" className="hover:text-foreground transition-colors">
                Suporte
              </a>
            </div>
            <p>© 2025 DosageZen. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print, nav, aside, button, footer {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          [data-radix-accordion-trigger],
          [data-radix-accordion-content] {
            all: unset !important;
            display: block !important;
          }
          
          main {
            max-width: 100% !important;
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TermosDeUso;
