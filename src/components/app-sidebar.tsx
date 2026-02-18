"use client"

import {
  LayoutDashboard,
  FileText,
  FilePlus,
  History,
  FlaskConical,
  Inbox,
  CheckCircle,
  Search,
  LogOut,
  ChevronUp,
  TestTubes,
  BarChart3,
  Users,
} from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { UserRole, UserRoleLabels } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function getNavItems(tipo: UserRole): NavItem[] {
  switch (tipo) {
    case UserRole.ADMIN:
    case UserRole.ORQUESTRADOR:
      return [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Indicadores", href: "/dashboard/admin", icon: BarChart3 },
        { title: "Usuários", href: "/dashboard/admin/usuarios", icon: Users },
        { title: "SATs Pendentes", href: "/dashboard/pendentes", icon: Inbox },
        { title: "SATs em Laboratório", href: "/dashboard/enviar", icon: TestTubes },
        { title: "Finalizadas", href: "/dashboard/historico", icon: CheckCircle },
      ]
    case UserRole.REPRESENTANTE:
      return [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Nova SAT", href: "/dashboard/nova-sat", icon: FilePlus },
        { title: "Minhas SATs", href: "/dashboard/minhas-sats", icon: FileText },
        { title: "Histórico", href: "/dashboard/historico", icon: History },
      ]
    case UserRole.BAGUA:
      return [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "SATs Recebidas", href: "/dashboard/recebidas", icon: Inbox },
        { title: "Em Análise", href: "/dashboard/em-analise", icon: Search },
        { title: "Finalizadas", href: "/dashboard/finalizadas", icon: CheckCircle },
      ]
    case UserRole.BSOLVENTE:
      return [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "SATs Recebidas", href: "/dashboard/recebidas", icon: Inbox },
        { title: "Em Análise", href: "/dashboard/em-analise", icon: Search },
        { title: "Finalizadas", href: "/dashboard/finalizadas", icon: CheckCircle },
      ]
    default:
      return [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
  }
}

function getUserInitials(usuario: string, email: string | null) {
  if (email) {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  return String(usuario).slice(0, 2)
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const navItems = getNavItems(user.tipo)

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header - Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/logo.svg"
                    alt="SatMaza"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">SatMaza</span>
                  <span className="text-xs text-muted-foreground">
                    {UserRoleLabels[user.tipo]}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href as never}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User info */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                      {getUserInitials(user.usuario, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.email ?? `Cód. ${user.usuario}`}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {UserRoleLabels[user.tipo]}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                      {getUserInitials(user.usuario, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.email ?? `Cód. ${user.usuario}`}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {UserRoleLabels[user.tipo]}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
