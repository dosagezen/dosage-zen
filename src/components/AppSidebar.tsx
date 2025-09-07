import { Calendar, Home, Pill, Users, FileText, Settings, MapPin, TrendingUp, LogOut, AlertTriangle, Shield } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { useAdminGuard } from "@/hooks/useAdminGuard"
import { useAuth } from "@/contexts/AuthContext"

const items = [
  { title: "Início", url: "/app", icon: Home },
  { title: "Conquistas", url: "/app/conquistas", icon: TrendingUp },
  { title: "Medicações", url: "/app/medicacoes", icon: Pill },
  { title: "Agenda", url: "/app/agenda", icon: Calendar },
  { title: "Farmácias", url: "/app/farmacias", icon: MapPin },
  { title: "Relatórios", url: "/app/relatorios", icon: FileText },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
]

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar()
  const location = useLocation()
  const { toast } = useToast()
  const { isAdmin } = useAdminGuard()
  const { signOut } = useAuth()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const isActive = (path: string) => currentPath === path
  const isInactive = (path: string) => ["/app/farmacias", "/app/compartilhar", "/app/relatorios"].includes(path)
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent/30 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/20 text-foreground/80"

  const handleMobileNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = async () => {
    // Fechar sidebar no mobile antes de fazer logout
    handleMobileNavClick()
    
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao tentar sair. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-gradient-soft">
        <div className="p-4 border-b border-border/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-primary">DosageZen</h2>
                <p className="text-xs text-muted-foreground">Sua saúde em dia</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-4 py-2">
            {!isCollapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => {
                        const baseClasses = getNavCls({ isActive })
                        const inactiveClasses = isInactive(item.url) ? " opacity-50" : ""
                        return baseClasses + inactiveClasses
                      }}
                      onClick={handleMobileNavClick}
                    >
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Item Admin (apenas para admin) */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/app/admin" 
                      className={({ isActive }) => getNavCls({ isActive })}
                      onClick={handleMobileNavClick}
                    >
                      <Shield className="w-5 h-5" />
                      {!isCollapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {/* Item Sair */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogoutClick}
                    className={getNavCls({ isActive: false })}
                  >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span>Sair</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Dialog de Confirmação de Logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}