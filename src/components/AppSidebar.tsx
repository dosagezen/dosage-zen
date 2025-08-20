import { Calendar, Home, Pill, Users, FileText, Settings, MapPin, TrendingUp } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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
import { useIsMobile } from "@/hooks/use-mobile"

const items = [
  { title: "Início", url: "/", icon: Home },
  { title: "Conquistas", url: "/conquistas", icon: TrendingUp },
  { title: "Medicações", url: "/medicacoes", icon: Pill },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Farmácias", url: "/farmacias", icon: MapPin },
  { title: "Compartilhar", url: "/compartilhar", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
]

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()

  const isActive = (path: string) => currentPath === path
  const isInactive = (path: string) => ["/farmacias", "/compartilhar", "/relatorios"].includes(path)
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent/30 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/20 text-foreground/80"

  const handleMobileNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
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
                <h2 className="font-semibold text-primary">Dosage Zen</h2>
                <p className="text-xs text-muted-foreground">Sua saúde em dia</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <Pill className="w-5 h-5 text-primary-foreground" />
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}