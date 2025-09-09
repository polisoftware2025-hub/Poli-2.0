

      
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Bell,
  Book,
  BookMarked,
  BotMessageSquare,
  Calendar,
  Check,
  CheckSquare,
  CreditCard,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Newspaper,
  Search,
  Settings,
  Star,
  User,
  X,
  Users,
  ClipboardList,
  LayoutDashboard,
  BarChart3,
  BookCopy,
  ClipboardCheck,
  UserCheck,
  Edit,
  FileText,
  Send,
  ImageIcon,
  BookUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type UserRole = "admin" | "gestor" | "docente" | "estudiante";

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole") as UserRole;
    const storedUserId = localStorage.getItem("userId");
    if (storedEmail && storedRole && storedUserId) {
      setUserEmail(storedEmail);
      setUserRole(storedRole);
      setUserId(storedUserId);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!userRole || !userId) return;

    const fetchNotifications = async () => {
        setIsLoadingNotifications(true);
        const fetchedNotifications: Notification[] = [];
        try {
            if (userRole === 'admin' || userRole === 'gestor') {
                const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
                // Simplified query to avoid composite index. Filter client-side.
                const q = query(studentsRef, orderBy("fechaRegistro", "desc"), limit(20));
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if(data.estado === "pendiente") {
                      const fechaRegistro = data.fechaRegistro?.toDate ? data.fechaRegistro.toDate() : data.fechaRegistro;
                      fetchedNotifications.push({
                          id: doc.id,
                          title: "Nueva solicitud de preinscripción",
                          description: `${data.nombreCompleto || 'Un aspirante'} ha enviado una solicitud.`,
                          time: fechaRegistro ? formatDistanceToNow(fechaRegistro, { addSuffix: true, locale: es }) : "Hace un momento",
                          read: false
                      });
                    }
                });
            } else if (userRole === 'estudiante') {
                 const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
                 const q = query(notesRef, where("estudianteId", "==", userId), orderBy("fecha", "desc"), limit(5));
                 const querySnapshot = await getDocs(q);
                 for (const noteDoc of querySnapshot.docs) {
                     const noteData = noteDoc.data();
                     const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", noteData.grupoId);
                     const groupSnap = await getDoc(groupRef);
                     const subjectName = groupSnap.exists() ? groupSnap.data().materia.nombre : 'una materia';
                     const fechaNota = noteData.fecha?.toDate ? noteData.fecha.toDate() : new Date();
                     
                     fetchedNotifications.push({
                         id: noteDoc.id,
                         title: "Nueva Calificación Disponible",
                         description: `Se ha publicado tu nota para ${subjectName}.`,
                         time: formatDistanceToNow(fechaNota, { addSuffix: true, locale: es }),
                         read: false
                     });
                 }
            }
            // In a real app, we might want to cap the number of notifications after client-side filtering.
            setNotifications(fetchedNotifications.slice(0, 5));
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };
    
    fetchNotifications();
  }, [userRole, userId]);

  const handleLogout = async () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
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
  
  const adminMenuItems = [
    { href: "/dashboard/admin", label: "Panel", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/pre-register", label: "Pre registro", icon: ClipboardList },
    { href: "/dashboard/admin/career", label: "Carreras", icon: BookCopy },
    { href: "/dashboard/admin/subjects", label: "Materias", icon: BookMarked },
    { href: "/dashboard/admin/groups", label: "Grupos", icon: Users },
    { href: "/dashboard/admin/asignar-docente", label: "Asignar Docentes", icon: BookUp },
    { href: "/dashboard/admin/payments", label: "Gestión Pagos", icon: CreditCard },
    { href: "/dashboard/admin/schedules", label: "Horarios", icon: Calendar },
    { href: "/dashboard/admin/media", label: "Gestión de Media", icon: ImageIcon },
    { href: "/dashboard/admin/analytics", label: "Analíticas", icon: BarChart3 },
    { href: "/dashboard/admin/notifications", label: "Notificaciones", icon: Bell },
  ];

  const studentMenuItems = [
    { href: "/dashboard/estudiante", label: "Panel", icon: Home },
    { href: "/dashboard/materias", label: "Materias", icon: Library },
    { href: "/dashboard/calificaciones", label: "Calificaciones", icon: GraduationCap },
    { href: "/dashboard/horarios", label: "Horarios", icon: Calendar },
    { href: "/dashboard/asistencias", label: "Asistencias", icon: CheckSquare },
    { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell },
    { href: "/dashboard/calendario", label: "Calendario Académico", icon: Calendar },
    { href: "/dashboard/pagos", label: "Ver mis Pagos", icon: CreditCard },
    { href: "/dashboard/evaluacion-docente", label: "Evaluar Docentes", icon: Star },
    { href: "/dashboard/empleo", label: "Bolsa de Empleo", icon: BotMessageSquare },
  ];
  
 const teacherMenuItems = [
    { href: "/dashboard/docente", label: "Panel", icon: LayoutDashboard },
    { href: "/dashboard/docente/cursos", label: "Mis Cursos", icon: BookCopy },
    { href: "/dashboard/horarios", label: "Horario", icon: Calendar },
    { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
    { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
    { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell },
];

  const managerMenuItems = [
      { href: "/dashboard/gestor", label: "Panel", icon: LayoutDashboard },
      { href: "/dashboard/gestor/payments", label: "Revisión de Pagos", icon: CreditCard },
      { href: "/dashboard/gestor/pre-register", label: "Pre-Inscripción", icon: ClipboardList },
      { href: "/dashboard/gestor/schedules", label: "Gestión de Horarios", icon: Calendar },
      { href: "/dashboard/gestor/grades", label: "Gestión de Notas", icon: Edit },
      { href: "/dashboard/gestor/reports", label: "Reportes", icon: FileText },
      { href: "/dashboard/gestor/announcements", label: "Anuncios", icon: Send },
      { href: "/dashboard/gestor/notifications", label: "Notificaciones", icon: Bell },
  ];

  const getMenuItems = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return adminMenuItems;
      case 'docente':
        return teacherMenuItems;
      case 'estudiante':
        return studentMenuItems;
      case 'gestor':
        return managerMenuItems;
      default:
        return [];
    }
  };

  const itemsToRender = userRole ? getMenuItems(userRole) : [];

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
          <SidebarHeader className="flex flex-col items-start p-3 gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="font-poppins text-xl font-bold text-primary-foreground">
                  Poli 2.0
              </span>
              <SidebarTrigger>
                  <X/>
              </SidebarTrigger>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-12 text-left">
                   <Avatar className="h-9 w-9 bg-primary-foreground text-primary">
                    <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-semibold text-primary-foreground">{userEmail}</span>
                     <span className="text-xs text-primary-foreground/80">{roleNames[userRole]}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {roleNames[userRole]}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="flex-1">
               {itemsToRender.map((item) => (
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
            <SidebarMenu className="mt-auto px-0 bg-red-600">
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        className="w-full bg-transparent text-white hover:bg-red-700"
                        tooltip={{
                            children: "Cerrar Sesión",
                            className: "group-data-[collapsible=icon]:flex hidden",
                        }}
                    >
                        <LogOut />
                        <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </div>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 shadow-sm sm:px-6">
           <div className="flex items-center gap-4">
               <SidebarTrigger>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
               </SidebarTrigger>
           </div>
            
           <div className="flex flex-1 items-center justify-center">
             <Link href="/dashboard" className="flex items-center gap-2 font-poppins text-2xl font-bold text-card-foreground">
                <GraduationCap className="h-8 w-8" />
                <span>Poli 2.0</span>
            </Link>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar..." className="pl-9 bg-background" />
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                        <Bell className="h-5 w-5"/>
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        )}
                        <span className="sr-only">Notificaciones</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                   <div className="p-4">
                       <div className="flex items-center justify-between">
                           <h4 className="font-semibold">Notificaciones</h4>
                           <Button variant="ghost" size="sm" className="text-sm">
                               <Check className="mr-2 h-4 w-4" />
                               Marcar todo como leído
                           </Button>
                       </div>
                   </div>
                   <Separator />
                   <div className="divide-y divide-border max-h-80 overflow-y-auto">
                        {isLoadingNotifications ? (
                            <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                        <p className="text-xs text-muted-foreground">{item.time}</p>
                                    </div>
                                    {!item.read && <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-sm text-muted-foreground">No tienes notificaciones nuevas.</div>
                        )}
                   </div>
                   <Separator />
                   <div className="p-2 text-center">
                       <Button variant="link" asChild className="text-primary">
                           <Link href="/dashboard/notifications">Ver todas las notificaciones</Link>
                       </Button>
                   </div>
                </PopoverContent>
            </Popover>
           </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
        <footer className="bg-primary text-primary-foreground p-4 text-center text-sm">
            © {new Date().getFullYear()} Politécnico Internacional. Todos los derechos reservados.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
