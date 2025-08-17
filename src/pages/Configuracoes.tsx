import { useState } from "react";
import { Settings, Users, Shield, Key, Bell, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfileManager } from "@/components/UserProfileManager";

const Configuracoes = () => {
  const [activeSection, setActiveSection] = useState("perfis");

  const sections = [
    { id: "perfis", label: "Perfis de Usuário", icon: Users },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "assinatura", label: "Assinatura", icon: CreditCard },
    { id: "privacidade", label: "Privacidade", icon: Key },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "perfis":
        return <UserProfileManager />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">
                {sections.find(s => s.id === activeSection)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border md:hidden">
        <div className="flex items-center gap-3 p-4">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-primary">Configurações</h1>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header Desktop */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Configurações</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de Seções */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="shadow-card">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-12 text-sm font-medium ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {section.label}
                        {section.id === "perfis" && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            4
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;