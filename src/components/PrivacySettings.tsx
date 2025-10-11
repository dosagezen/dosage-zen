import { useNavigate } from "react-router-dom";
import { FileText, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PrivacySettings = () => {
  const navigate = useNavigate();

  const handleNavigateToTerms = () => {
    navigate("/legal/termos-de-uso");
  };

  const handleNavigateToPrivacy = () => {
    navigate("/legal/politica-privacidade");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Privacidade e Proteção de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Texto Introdutório */}
        <div className="space-y-2">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            O DosageZen leva sua privacidade a sério. Nesta seção, você encontra os{" "}
            <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>, 
            documentos que explicam como o app funciona, como tratamos seus dados e quais 
            são os seus direitos.
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Recomendamos que leia atentamente esses documentos antes de continuar utilizando o app.
          </p>
        </div>

        {/* Callout Informativo - Conformidade */}
        <Alert className="bg-primary/5 border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground ml-2">
            Estamos em conformidade com a <strong>LGPD (Brasil)</strong> e alinhados com 
            normas internacionais, como a <strong>GDPR (Europa)</strong> e{" "}
            <strong>CCPA (EUA)</strong>.
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Seção 1: Termos de Uso */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Termos de Uso
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Os Termos de Uso explicam as condições para o uso do DosageZen, 
                as responsabilidades dos usuários e do app, bem como informações 
                sobre planos, contas, cancelamentos e permissões.
              </p>
              <Button
                onClick={handleNavigateToTerms}
                className="w-full md:w-auto"
                variant="default"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Termos de Uso
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção 2: Política de Privacidade */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Política de Privacidade
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A Política de Privacidade detalha como coletamos, utilizamos e 
                protegemos seus dados pessoais e sensíveis, bem como seus direitos 
                de acesso, exclusão e revogação de consentimento. A transparência 
                é um compromisso essencial do DosageZen.
              </p>
              <Button
                onClick={handleNavigateToPrivacy}
                className="w-full md:w-auto"
                variant="default"
              >
                <Shield className="w-4 h-4 mr-2" />
                Ver Política de Privacidade
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
