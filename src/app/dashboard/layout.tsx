
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
  SidebarFooter,
  SidebarHeader,
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

type UserRole = "admin" | "gestor" | "docente" | "estudiante" | "rector";

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    timestamp: Date;
}

const roleConfig: Record<UserRole, { accentColor: string, gradient?: string }> = {
    estudiante: { accentColor: "bg-blue-500/80" },
    docente: { accentColor: "bg-green-500/80" },
    gestor: { accentColor: "bg-purple-500/80" },
    admin: { accentColor: "bg-primary/80", gradient: "from-primary/95 to-blue-900/90" },
    rector: { accentColor: "bg-amber-500/80", gradient: "from-slate-900/95 to-slate-800/90" },
};


const HoverIndicator = () => (
  <motion.div
    layoutId="sidebar-hover-indicator"
    className="absolute inset-0 rounded-lg"
    style={{ background: "hsla(var(--accent-hsl), 0.5)" }}
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
            { href: "/dashboard/admin/notifications", label: "Notificaciones", icon: Bell },
        ];

        const rectorMenuItems = [
            { href: "/dashboard/rector", label: "Panel Rectoría", icon: LayoutDashboard },
             { type: 'header', label: 'Supervisión' },
            { href: "/dashboard/admin/users", label: "Gestión de Usuarios", icon: ShieldCheck },
            ...adminMenuItems.filter(item => !['/dashboard/admin', '/dashboard/admin/users'].includes(item.href || '') && item.type !== 'header'),
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
        <nav className="flex flex-col gap-1 px-4">
            <AnimatePresence>
                {menuItems.map((item, index) => 
                    item.type === 'header' ? (
                        <motion.h4 
                            key={index}
                            className="px-2 pt-4 pb-1 text-xs font-semibold text-white/50"
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
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 transition-colors hover:text-white",
                                    pathname === item.href && "font-semibold text-white"
                                )}>
                                    {hoveredItem === item.href && <HoverIndicator />}
                                    {pathname === item.href && <motion.div layoutId="sidebar-active-indicator" className={cn("absolute inset-0 rounded-lg", roleConfig[role].accentColor)} />}
                                    <item.icon className="h-5 w-5 z-10 shrink-0" />
                                    <span className="z-10">{item.label}</span>
                                </div>
                            </Link>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </nav>
    );
}

function DynamicSidebar({ role, pathname, onLinkClick }: { role: UserRole, pathname: string, onLinkClick: () => void }) {
    const config = roleConfig[role];
    const gradientClass = config.gradient ? `bg-gradient-to-b ${config.gradient}` : 'bg-primary/95';

    return (
        <div className={cn("flex h-full flex-col backdrop-blur-md", gradientClass)}>
            <SidebarHeader />
            <SidebarContent>
                <SidebarItems role={role} pathname={pathname} onItemClick={onLinkClick} />
            </SidebarContent>
            <SidebarFooter />
        </div>
    );
}

function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [isMenuOpen, setMenuOpen] = useState(false);

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
            } finally {
                setIsLoadingNotifications(false);
            }
        };
        fetchNotifications();
    }, [userRole, userId]);

    const handleLogout = async () => {
        localStorage.clear();
        toast({ title: "Cierre de sesión exitoso" });
        router.push("/");
    };

    const getInitials = (email: string | null | undefined) => {
        if (!email) return "U";
        return email.substring(0, 2).toUpperCase();
    };

    const roleNames: Record<UserRole, string> = {
        rector: "Rector", admin: "Administrador", gestor: "Gestor",
        docente: "Docente", estudiante: "Estudiante",
    };

    if (!userEmail || !userRole) {
        return (
           <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <p>Cargando...</p>
          </div>
        );
    }

    return (
        <>
            <SidebarProvider>
                <Sidebar side="left" collapsible="icon">
                    {userRole && <DynamicSidebar role={userRole} pathname={pathname} onLinkClick={() => setMenuOpen(false)} />}
                </Sidebar>
                <SidebarInset>
                    <div className="flex-1 bg-background">
                        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 shadow-sm:px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
                                </SidebarTrigger>
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 bg-primary-foreground text-primary">
                                                <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                                            </Avatar>
                                            <div className="hidden flex-col items-start truncate md:flex">
                                                <span className="text-sm font-semibold text-foreground">{userEmail}</span>
                                                <span className="text-xs text-muted-foreground">{roleNames[userRole]}</span>
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <p className="text-sm font-medium leading-none">{userEmail}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" /><span>Perfil</span></Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" /><span>Configuración</span></Link></DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Cerrar Sesión</span></DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </header>
                        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                    </div>
                    <footer className="bg-primary text-primary-foreground p-4 text-center text-sm">
                        © 2025 Poli 2.0. Todos los derechos reservados.
                    </footer>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <MainLayout>{children}</MainLayout>
        </SidebarProvider>
    );
}
