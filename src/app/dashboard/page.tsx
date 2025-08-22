
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, LogOut, Bell, ChevronRight, User, BarChart2, Settings } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";


export default function DashboardPage() {
  const router = useRouter();

  // Since auth is removed, we'll use a placeholder user.
  // You should replace this with logic to fetch user data from Firestore.
  const user = {
    email: 'estudiante@example.com'
  }

  const handleLogout = async () => {
    // Since auth is removed, just redirect to home.
    router.push("/");
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-[#002147]" />
                    <span className="hidden font-poppins text-xl font-bold text-[#002147] sm:block">
                    Poli Intl.
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Notificaciones</span>
                </Button>

                <div className="flex items-center gap-2">
                    <span className="hidden text-sm font-medium text-gray-700 sm:block">{user.email}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.email}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        Estudiante
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <BarChart2 className="mr-2 h-4 w-4" />
                                <span>Calificaciones</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Preferencias</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
        <div className="border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex py-3 text-sm" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                        <a href="#" className="inline-flex items-center text-gray-700 hover:text-[#004aad]">
                            Área personal
                        </a>
                        </li>
                        <li>
                        <div className="flex items-center">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <a href="#" className="ml-1 text-gray-700 hover:text-[#004aad] md:ml-2">Mis cursos</a>
                        </div>
                        </li>
                    </ol>
                </nav>
            </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
         <div className="container mx-auto">
             <Card>
                 <CardHeader>
                     <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
                        ¡Bienvenido de vuelta, estudiante!
                     </CardTitle>
                     <CardDescription className="font-poppins text-gray-600">
                        Este es tu panel de control. Desde aquí puedes gestionar tus cursos, ver tus calificaciones y mucho más.
                     </CardDescription>
                 </CardHeader>
                 <CardContent>
                     <p className="text-gray-700">Has iniciado sesión como: <span className="font-semibold text-[#004aad]">{user.email}</span></p>
                 </CardContent>
             </Card>
         </div>
      </main>
    </div>
  );
}

    