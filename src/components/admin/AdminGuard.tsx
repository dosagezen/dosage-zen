import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAdminGuard } from "@/hooks/useAdminGuard";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin } = useAdminGuard();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-lg shadow-card p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Acesso Restrito
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Esta área é exclusiva para administradores do sistema. 
              Você não possui as permissões necessárias para acessar esta página.
            </p>
            
            <Button 
              onClick={() => navigate('/app')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}