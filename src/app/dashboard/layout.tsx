
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Book,
  BotMessageSquare,
  Calendar,
  CreditCard,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Newspaper,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiSuggestions } from "@/components/ai/ai-suggestions";

type UserRole = "admin" | "gestor" | "docente" | "estudiante";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole") as UserRole;
    if (storedEmail && storedRole) {
      setUserEmail(storedEmail);
      setUserRole(storedRole);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    toast({
      title: "Cierre de sesión exitoso",
      description: "Has cerrado sesión correctamente.",
    });
    router.push("/");
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { href: "/dashboard", label: "Panel", icon: Home, roles: ["admin", "gestor", "docente", "estudiante"] },
    { href: "/dashboard/materias", label: "Materias", icon: Library, roles: ["estudiante", "docente"] },
    { href: "/dashboard/calificaciones", label: "Calificaciones", icon: GraduationCap, roles: ["estudiante"] },
    { href: "/dashboard/horarios", label: "Horarios", icon: Calendar, roles: ["estudiante", "docente"] },
    { href: "/dashboard/calendario", label: "Calendario Académico", icon: Calendar, roles: ["admin", "gestor", "docente", "estudiante"] },
    { href: "/dashboard/noticias", label: "Noticias y Anuncios", icon: Newspaper, roles: ["admin", "gestor", "docente", "estudiante"] },
    { href: "/dashboard/empleo", label: "Bolsa de Empleo", icon: BotMessageSquare, roles: ["estudiante"] },
    { href: "/dashboard/pagos", label: "Ver mis Pagos", icon: CreditCard, roles: ["estudiante"] },
  ];

  if (!userEmail || !userRole) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    );
  }

  const roleNames: Record<UserRole, string> = {
    admin: "Administrador",
    gestor: "Gestor",
    docente: "Docente",
    estudiante: "Estudiante",
  };

  return (
    <SidebarProvider>
      <div className="bg-primary text-primary-foreground">
        <Sidebar>
          <SidebarHeader>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-left h-auto hover:bg-primary/80 focus-visible:ring-offset-primary">
                   <Avatar className="h-8 w-8 bg-primary-foreground text-primary">
                    <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden text-primary-foreground">
                      <span className="text-sm font-medium">{userEmail}</span>
                      <span className="text-xs text-primary-foreground/80">{roleNames[userRole]}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {roleNames[userRole]}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               {menuItems.filter(item => userRole && item.roles.includes(userRole)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="text-primary-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                    tooltip={{
                      children: item.label,
                      className: "group-data-[collapsible=icon]:flex hidden",
                    }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <AiSuggestions />
          </SidebarContent>
        </Sidebar>
      </div>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
           <SidebarTrigger className="text-card-foreground"/>
           <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-poppins text-xl font-bold text-primary">
              Poli 2.0
            </span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
