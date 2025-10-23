
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarFooter,
  SidebarInset,
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
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Clock,
  Wand2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserPreferences } from "@/context/UserPreferencesContext";

type UserRole = "admin" | "gestor" | "docente" | "estudiante" | "rector";

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    timestamp: Date;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const roleNames: Record<UserRole, string> = {
    rector: "Rector", admin: "Administrador", gestor: "Gestor",
    docente: "Docente", estudiante: "Estudiante",
};

const HoverIndicator = () => (
  <motion.div
    layoutId="sidebar-hover-indicator"
    className="absolute inset-0 rounded-lg bg-accent/50 dark:bg-accent"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.2 } }}
    exit={{ opacity: 0, transition: { duration: 0.1 } }}
  />
);

interface SidebarItemsProps {
    role: UserRole;
    pathname: string;
    onItemClick: () => void;
}

const SidebarItems = ({ role, pathname, onItemClick }: SidebarItemsProps) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const menuItems = useMemo(() => {
        const adminMenuItems = [
            { href: "/dashboard/admin", label: "Panel", icon: LayoutDashboard },
            { type: 'header', label: 'Gestión Principal' },
            { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
            { href: "/dashboard/admin/pre-register", label: "Pre registro", icon: ClipboardList },
            { href: "/dashboard/admin/career", label: "Carreras", icon: BookCopy },
            { type: 'header', label: 'Académico' },
            { href: "/dashboard/admin/subjects", label: "Materias", icon: BookMarked },
            { href: "/dashboard/admin/groups", label: "Grupos", icon: Users },
            { href: "/dashboard/admin/schedules", label: "Horarios", icon: Calendar },
            { href: "/dashboard/admin/schedules/generate", label: "Generar Horario", icon: Wand2 },
            { href: "/dashboard/admin/asignar-docente", label: "Asignar Docentes", icon: BookUp },
            { href: "/dashboard/admin/validate-teachers", label: "Validar Docentes", icon: ShieldCheck },
            { type: 'header', label: 'Financiero y Reportes' },
            { href: "/dashboard/admin/payments", label: "Gestión Pagos", icon: CreditCard },
            { href: "/dashboard/admin/analytics", label: "Analíticas", icon: BarChart3 },
            { href: "/dashboard/admin/reports", label: "Reportes", icon: FileText },
            { type: 'header', label: 'Configuración' },
            { href: "/dashboard/admin/media", label: "Gestión de Media", icon: ImageIcon },
        ];

        const rectorMenuItems = [
            { href: "/dashboard/rector", label: "Panel Rectoría", icon: LayoutDashboard },
             { type: 'header', label: 'Supervisión' },
            { href: "/dashboard/admin/users", label: "Gestión de Usuarios", icon: ShieldCheck },
            ...adminMenuItems.filter(item => !['/dashboard/admin', '/dashboard/admin/users'].includes(item.href || '')),
            { type: 'header', label: 'Auditoría' },
            { href: "/dashboard/rector/audit", label: "Auditoría de Cambios", icon: ShieldAlert },
            { href: "/dashboard/rector/settings", label: "Configuración Global", icon: SlidersHorizontal },
        ];

        const studentMenuItems = [
            { href: "/dashboard/estudiante", label: "Panel", icon: Home },
            { href: "/dashboard/materias", label: "Materias", icon: Library },
            { href: "/dashboard/calificaciones", label: "Calificaciones", icon: GraduationCap },
            { href: "/dashboard/horarios", label: "Horarios", icon: Calendar },
            { href: "/dashboard/asistencias", label: "Asistencias", icon: CheckSquare },
            { href: "/dashboard/pagos", label: "Ver mis Pagos", icon: CreditCard },
            { type: 'header', label: 'Comunidad y Ayuda' },
            { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell },
            { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
            { href: "/dashboard/evaluacion-docente", label: "Evaluar Docentes", icon: Star },
            { href: "/dashboard/empleo", label: "Bolsa de Empleo", icon: BotMessageSquare },
            { type: 'header', label: 'Cuenta' },
            { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
        ];
        
        const teacherMenuItems = [
            { href: "/dashboard/docente", label: "Panel", icon: LayoutDashboard },
            { href: "/dashboard/docente/cursos", label: "Mis Cursos", icon: BookCopy },
            { href: "/dashboard/horarios", label: "Horario", icon: Calendar },
            { href: "/dashboard/docente/disponibilidad", label: "Mi Disponibilidad", icon: Clock },
            { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
            { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
            { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell },
        ];

        const managerMenuItems = [
            { href: "/dashboard/gestor", label: "Panel", icon: LayoutDashboard },
            { href: "/dashboard/gestor/payments", label: "Revisión de Pagos", icon: CreditCard },
            { href: "/dashboard/gestor/pre-register", label: "Pre-Inscripción", icon: ClipboardList },
            { href: "/dashboard/admin/schedules", label: "Gestión de Horarios", icon: Calendar },
            { href: "/dashboard/gestor/grades", label: "Gestión de Notas", icon: Edit },
            { href: "/dashboard/admin/validate-teachers", label: "Validar Docentes", icon: ShieldCheck },
            { href: "/dashboard/gestor/reports", label: "Reportes", icon: FileText },
            { href: "/dashboard/gestor/announcements", label: "Anuncios", icon: Send },
            { href: "/dashboard/gestor/notifications", label: "Notificaciones", icon: Bell },
            { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
        ];
        
        switch (role) {
            case 'rector': return rectorMenuItems;
            case 'admin': return adminMenuItems;
            case 'docente': return teacherMenuItems;
            case 'estudiante': return studentMenuItems;
            case 'gestor': return managerMenuItems;
            default: return [];
        }
    }, [role]);

    return (
        <nav className="flex flex-col gap-1">
            <AnimatePresence>
                {menuItems.map((item, index) => 
                    item.type === 'header' ? (
                        <motion.h4 
                            key={index}
                            className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                        >
                            {item.label}
                        </motion.h4>
                    ) : (
                        <motion.div
                            key={item.href}
                            onMouseEnter={() => setHoveredItem(item.href!)}
                            onMouseLeave={() => setHoveredItem(null)}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                        >
                            <Link href={item.href!} onClick={onItemClick}>
                                <div className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/80 transition-colors hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
                                    pathname === item.href && "font-semibold text-foreground"
                                )}>
                                    {hoveredItem === item.href && <HoverIndicator />}
                                    {pathname === item.href && (
                                        <motion.div 
                                            layoutId="sidebar-active-indicator" 
                                            className={cn("absolute inset-0 rounded-lg bg-accent")} 
                                        />
                                    )}
                                    <item.icon className={cn("h-5 w-5 z-10 shrink-0", pathname === item.href && "text-accent-foreground")} />
                                    <span className="z-10 group-data-[collapsible=icon]:hidden">{item.label}</span>
                                </div>
                            </Link>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </nav>
    );
};


const DynamicSidebar = ({ role, pathname, onItemClick, userEmail, userName, handleLogout }: any) => {
    const getDisplayName = () => {
        if (!userName) return "";
        const parts = userName.split(" ");
        if (parts.length > 2) {
             const connectors = ['de', 'del', 'la', 'los', 'las'];
            if (connectors.includes(parts[1].toLowerCase())) {
                return `${parts[0]} ${parts[2]}`;
            }
            return `${parts[0]} ${parts[1]}`;
        }
        return userName;
    };

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-3">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-10 w-10 border-2 border-primary/50 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all">
                                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                         <TooltipContent side="right" align="center" className="group-data-[collapsible=icon]:block hidden">
                            {userName}
                            <p className="text-xs text-muted-foreground">{userEmail}</p>
                         </TooltipContent>
                     </Tooltip>
                    <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                        <h3 className="font-semibold text-base truncate">{getDisplayName()}</h3>
                        <p className="text-xs text-foreground/60 truncate">{userEmail}</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                 <SidebarItems role={role} pathname={pathname} onItemClick={onItemClick} />
            </SidebarContent>
            <SidebarFooter className="mt-auto">
                 <Link href="/dashboard/settings" onClick={onItemClick}>
                    <div className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/80 transition-colors hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2")}>
                        <Settings className={cn("h-5 w-5 z-10 shrink-0")} />
                        <span className="z-10 group-data-[collapsible=icon]:hidden">Configuración</span>
                    </div>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                </Button>
            </SidebarFooter>
        </>
    );
};

function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isMenuOpen, setMenuOpen] = useState(false);
    
    const { preferences } = useUserPreferences();

    const userStyle: React.CSSProperties = {
        '--primary-hue': preferences.primaryColor.hue,
        '--primary-saturation': `${preferences.primaryColor.saturation}%`,
        '--primary-lightness': `${preferences.primaryColor.lightness}%`,
        '--accent-hue': preferences.accentColor.hue,
        '--accent-saturation': `${preferences.accentColor.saturation}%`,
        '--accent-lightness': `${preferences.accentColor.lightness}%`,
        '--font-family': preferences.fontFamily,
        '--global-font-size': preferences.fontSize,
        '--font-weight': preferences.fontWeight,
        '--letter-spacing': preferences.letterSpacing,
        '--radius': `${preferences.borderRadius}rem`,
        '--blur-intensity': `${preferences.blurIntensity}px`,
    } as React.CSSProperties;


    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        const storedRole = localStorage.getItem("userRole") as UserRole;
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");

        if (storedEmail && storedRole && storedUserId && storedUserName) {
            setUserEmail(storedEmail);
            setUserRole(storedRole);
            setUserId(storedUserId);
            setUserName(storedUserName);
        } else {
            router.push("/login");
        }
    }, [router]);
    
    useEffect(() => {
        if (!userRole || !userId) return;

        const fetchNotifications = async () => {
            const fetchedNotifications: Notification[] = [];
            try {
                if (userRole === 'admin' || userRole === 'gestor' || userRole === 'rector') {
                    const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
                    const q = query(studentsRef, where("estado", "==", "pendiente"), limit(5));
                    const querySnapshot = await getDocs(q);
                    
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        const fechaRegistro = data.fechaRegistro?.toDate ? data.fechaRegistro.toDate() : new Date();
                        fetchedNotifications.push({
                            id: doc.id,
                            title: "Nueva solicitud de preinscripción",
                            description: `${data.nombreCompleto || 'Un aspirante'} ha enviado una solicitud.`,
                            time: formatDistanceToNow(fechaRegistro, { addSuffix: true, locale: es }),
                            read: false,
                            timestamp: fechaRegistro
                        });
                    });
                } else if (userRole === 'estudiante') {
                     const notesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/notas");
                     const q = query(notesRef, where("estudianteId", "==", userId));
                     const querySnapshot = await getDocs(q);
                     
                     for (const noteDoc of querySnapshot.docs) {
                         const noteData = noteDoc.data();
                         const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", noteData.grupoId);
                         const groupSnap = await getDoc(groupRef);
                         const subjectName = groupSnap.exists() ? groupSnap.data()?.materia?.nombre : 'una materia';
                         const fechaNota = noteData.fecha?.toDate ? noteData.fecha.toDate() : new Date();
                         
                         fetchedNotifications.push({
                             id: noteDoc.id,
                             title: "Nueva Calificación Disponible",
                             description: `Se ha publicado tu nota para ${subjectName}.`,
                             time: formatDistanceToNow(fechaNota, { addSuffix: true, locale: es }),
                             read: false,
                             timestamp: fechaNota
                         });
                     }
                }
                
                fetchedNotifications.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
                setNotifications(fetchedNotifications);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };
        fetchNotifications();
    }, [userRole, userId]);

    const handleLogout = async () => {
        localStorage.clear();
        toast({ title: "Cierre de sesión exitoso" });
        router.push("/");
    };

    if (!userRole) {
        return null; 
    }

    return (
        <div style={userStyle} className={cn(preferences.themeMode === 'dark' && 'dark')}>
            <SidebarProvider>
                <Sidebar side="left" collapsible="icon" className="font-sans bg-[hsl(220_40%_90%)] dark:bg-card">
                    <DynamicSidebar 
                        role={userRole} 
                        pathname={pathname} 
                        onItemClick={() => setMenuOpen(false)}
                        userEmail={userEmail}
                        userName={userName}
                        handleLogout={handleLogout} 
                    />
                </Sidebar>
                <SidebarInset className="bg-background dark:bg-[hsl(var(--background))]">
                    <div className="flex-1">
                        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-lg sm:px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
                                </SidebarTrigger>
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Bell className="h-5 w-5" />
                                            {notifications.filter(n => !n.read).length > 0 && 
                                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            }
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-80" align="end">
                                        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                                        <DropdownMenuSeparator/>
                                        {notifications.length > 0 ? notifications.slice(0, 4).map(n => (
                                            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
                                                <p className="font-semibold">{n.title}</p>
                                                <p className="text-xs text-muted-foreground">{n.description}</p>
                                                <p className="text-xs text-muted-foreground self-end">{n.time}</p>
                                            </DropdownMenuItem>
                                        )) : <DropdownMenuItem>No tienes notificaciones nuevas.</DropdownMenuItem>}
                                            <DropdownMenuSeparator/>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard/notifications" className="justify-center">Ver todas</Link>
                                            </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </header>
                        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                    </div>
                    <footer className="bg-card text-center text-sm p-4 border-t">
                        © {new Date().getFullYear()} Poli 2.0. Todos los derechos reservados.
                    </footer>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
        const timer = setTimeout(() => setIsLoading(false), 2000); 
        return () => clearTimeout(timer);
    }
  }, [isClient]);

  if (isLoading && isClient) { 
     return (
        <div className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center p-4 polygon-bg overflow-hidden">
          <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
            <div className="wheel"></div>
            <div className="hamster">
                <div className="hamster__body">
                    <div className="hamster__head">
                        <div className="hamster__ear"></div>
                        <div className="hamster__eye"></div>
                        <div className="hamster__nose"></div>
                    </div>
                    <div className="hamster__limb hamster__limb--fr"></div>
                    <div className="hamster__limb hamster__limb--fl"></div>
                    <div className="hamster__limb hamster__limb--br"></div>
                    <div className="hamster__limb hamster__limb--bl"></div>
                    <div className="hamster__tail"></div>
                </div>
            </div>
            <div className="spoke"></div>
          </div>
          <p className="font-poppins text-lg font-semibold text-foreground mt-4">Redirigiendo a tu panel...</p>
        </div>
      );
  }

  return (
    <SidebarProvider>
        <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  );
}
