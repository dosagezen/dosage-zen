import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Settings, Users, Shield, Key, Bell, CreditCard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfileManager } from "@/components/UserProfileManager";
import MyProfileSection from "@/components/MyProfileSection";

const Configuracoes = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState("meu-perfil")

  // Sincronizar com URL params
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && sections.find(s => s.id === section)) {
      setActiveSection(section)
      // Rolar para o topo quando navegar via URL
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }, [searchParams])

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    // Detectar se estamos no contexto do AppLayout (/app/) ou não
    const isInAppContext = location.pathname.startsWith('/app/')
    const basePath = isInAppContext ? '/app/configuracoes' : '/configuracoes'
    
    // Rolar para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Atualizar rota interna sem reload
    if (sectionId === 'meu-perfil') {
      navigate(basePath, { replace: true })
    } else {
      navigate(`${basePath}?section=${sectionId}`, { replace: true })
    }
  }

  const sections = [
    { id: "meu-perfil", label: "Meu Perfil", icon: User },
    { id: "colaboradores", label: "Colaboradores", icon: Users },
    { id: "assinatura", label: "Assinatura", icon: CreditCard },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "privacidade", label: "Privacidade", icon: Key },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "meu-perfil":
        return <MyProfileSection />;
      case "colaboradores":
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
        <div className="p-4">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências</p>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header Desktop */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
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
                        onClick={() => handleSectionChange(section.id)}
                        aria-label={`Ir para seção ${section.label}`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {section.label}
                        {section.id === "colaboradores" && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            4
                          </Badge>
                        )}
                        {section.id === "meu-perfil" && (
                          <Badge className="ml-auto text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-white">
                            Você
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