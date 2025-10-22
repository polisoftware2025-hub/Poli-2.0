"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

type BreadcrumbPart = {
  name: string;
  href: string;
};

// Helper function to truncate long strings
const truncateString = (str: string, num: number) => {
    if (!str) return '';
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + "...";
};

const isDynamicSegment = (segment: string) => {
    if (!segment) return false; // Defensive check for null/undefined segments
    // A simple heuristic: check if it's a long string with mixed chars, likely a Firestore ID.
    return segment.length > 15 && /[a-zA-Z]/.test(segment) && /[0-9]/.test(segment);
}


const Breadcrumbs = ({ customBreadcrumbs }: { customBreadcrumbs?: BreadcrumbPart[] }) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const getDashboardHomePath = () => {
      const role = localStorage.getItem("userRole");
      return role ? `/dashboard/${role}` : '/dashboard';
  }

  // Handle public pages breadcrumbs separately
  if (pathname.startsWith('/programas')) {
       const pathSegments = pathname.split('/').filter(segment => segment);
       const isListPage = pathSegments.length === 1;
       const programName = customBreadcrumbs ? customBreadcrumbs[0].name : 'Detalle';

      return (
          <nav className="flex items-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 mx-1" />
              {isListPage ? (
                  <span className="font-medium text-foreground">Programas</span>
              ) : (
                  <>
                      <Link href="/programas" className="hover:text-primary transition-colors">
                          Programas
                      </Link>
                      <ChevronRight className="h-4 w-4 mx-1" />
                      <span className="font-medium text-foreground">{truncateString(programName, 25)}</span>
                  </>
              )}
          </nav>
      );
  }

  // Dashboard breadcrumbs logic
  const homePath = getDashboardHomePath();
  const pathSegments = pathname.split('/').filter(Boolean);
  
  const dashboardBaseIndex = pathSegments.findIndex(p => p === 'dashboard');
  if (dashboardBaseIndex === -1) {
    return null; // Don't render breadcrumbs if not in a dashboard context
  }

  const breadcrumbParts = pathSegments.slice(dashboardBaseIndex + 1).filter(p => p !== userRole);

  const getBreadcrumbName = (segment: string) => {
    const names: { [key: string]: string } = {
      'dashboard': 'Panel', 'materias': 'Materias', 'notifications': 'Notificaciones',
      'profile': 'Mi Perfil', 'settings': 'Configuración', 'admin': 'Admin',
      'docente': 'Docente', 'estudiante': 'Estudiante', 'gestor': 'Gestor',
      'users': 'Usuarios', 'add-user': 'Agregar Usuario', 'edit-user': 'Editar Usuario',
      'pre-register': 'Pre-Inscripción', 'subjects': 'Materias',
      'payments': 'Pagos', 'schedules': 'Horarios', 'analytics': 'Analíticas',
      'calificaciones': 'Calificaciones', 'horarios': 'Horarios', 'asistencias': 'Asistencias',
      'calendario': 'Calendario Académico', 'noticias': 'Noticias', 'empleo': 'Bolsa de Empleo',
      'pagos': 'Mis Pagos', 'evaluacion-docente': 'Evaluación Docente', 'career': 'Carreras',
      'requests': 'Solicitudes', 'reports': 'Reportes', 'grades': 'Calificaciones',
      'announcements': 'Anuncios', 'grupos': 'Mis Grupos', 'notas': 'Registro de Notas',
      'asistencia': 'Toma de Asistencia', 'details': 'Detalles', 'new-career': 'Nueva Carrera',
      'edit': 'Editar', 'asignar-docente': 'Asignar Docente', 'media': 'Media'
    };
    if (names[segment]) {
        return names[segment];
    }
    // If it's a dynamic segment (ID), don't display it. The parent function will handle filtering it out from links.
    if (isDynamicSegment(segment)) {
        return getBreadcrumbName(pathSegments[pathSegments.indexOf(segment) - 1] || segment) || segment; // Try to get name from parent
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };
  
  const leafSegments = ['add-user', 'edit-user', 'details', 'new-career', 'edit'];

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link href={homePath} className="hover:text-primary transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbParts.map((segment, index) => {
        if (isDynamicSegment(segment)) return null; 

        const isLast = index === breadcrumbParts.length - 1 || isDynamicSegment(breadcrumbParts[index + 1]);
        const isLeafNode = leafSegments.includes(segment);
        
        let path = `/dashboard/${[userRole, ...breadcrumbParts.slice(0, index)].filter(p => !isDynamicSegment(p)).join('/')}`;
        if(!isLeafNode) {
           path = `/dashboard/${[userRole, ...breadcrumbParts.slice(0, index + 1)].filter(p => !isDynamicSegment(p)).join('/')}`;
        }
        
        return (
          <React.Fragment key={segment + index}>
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast || isLeafNode ? (
              <span className="font-medium text-foreground">{getBreadcrumbName(segment)}</span>
            ) : (
              <Link href={path} className="hover:text-primary transition-colors">
                {getBreadcrumbName(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  backPath?: string;
  breadcrumbs?: BreadcrumbPart[];
}

export const PageHeader = ({ title, description, icon, backPath, breadcrumbs }: PageHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (backPath) {
        router.push(backPath);
        return;
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 1) { // Adjusted to handle root level like /programas
      const parentPath = `/${segments.slice(0, segments.length - 1).join('/')}`;
      router.push(parentPath);
    } else {
      router.back();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-4 flex-1">
            <Breadcrumbs customBreadcrumbs={breadcrumbs} />
            <div className="flex items-center gap-4">
              {icon}
              <div>
                <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className="font-poppins text-gray-600">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleBack} className="shrink-0 sm:ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
