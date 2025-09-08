
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

const Breadcrumbs = ({ customBreadcrumbs }: { customBreadcrumbs?: BreadcrumbPart[] }) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const homePath = userRole ? `/dashboard/${userRole}` : '/dashboard';
  
  if (customBreadcrumbs) {
      return (
        <nav className="flex items-center text-sm text-muted-foreground">
          <Link href={homePath} className="hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {customBreadcrumbs.map((crumb, index) => (
             <React.Fragment key={crumb.href}>
                <ChevronRight className="h-4 w-4 mx-1" />
                {index === customBreadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground">{crumb.name}</span>
                ) : (
                    <Link href={crumb.href} className="hover:text-primary transition-colors">
                        {crumb.name}
                    </Link>
                )}
            </React.Fragment>
          ))}
        </nav>
      )
  }


  const pathSegments = pathname.split('/').filter(segment => segment);

  const getBreadcrumbName = (segment: string) => {
    const names: { [key: string]: string } = {
      'dashboard': 'Panel',
      'materias': 'Materias',
      'notifications': 'Notificaciones',
      'profile': 'Mi Perfil',
      'settings': 'Configuración',
      'admin': 'Admin',
      'docente': 'Docente',
      'estudiante': 'Estudiante',
      'gestor': 'Gestor',
      'users': 'Usuarios',
      'add-user': 'Agregar Usuario',
      'edit-user': 'Editar Usuario',
      'pre-register': 'Pre-Inscripción',
      'subjects': 'Materias',
      'payments': userRole === 'admin' ? 'Gestión de Pagos' : (userRole === 'gestor' ? 'Revisión de Pagos' : 'Pagos'),
      'schedules': 'Horarios',
      'analytics': 'Analíticas',
      'calificaciones': 'Calificaciones',
      'horarios': 'Horarios',
      'asistencias': 'Asistencias',
      'calendario': 'Calendario Académico',
      'noticias': 'Noticias y Anuncios',
      'empleo': 'Bolsa de Empleo',
      'pagos': 'Mis Pagos',
      'evaluacion-docente': 'Evaluación Docente',
      'career': 'Carreras',
      'requests': 'Solicitudes',
      'reports': 'Reportes',
      'grades': 'Calificaciones',
      'announcements': 'Anuncios',
      'grupos': 'Mis Grupos',
      'notas': 'Registro de Notas',
      'asistencia': 'Toma de Asistencia'
    };
    if (names[segment]) {
        return names[segment];
    }
    if (segment.length > 10 || segment.match(/^[a-z0-9-_]+$/)) {
      return "Detalle";
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };
  
  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link href={homePath} className="hover:text-primary transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {pathSegments.map((segment, index) => {
        if (segment === 'dashboard' || segment === userRole) return null;
        
        const currentPath = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;

        return (
          <React.Fragment key={currentPath}>
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{getBreadcrumbName(segment)}</span>
            ) : (
              <Link href={currentPath} className="hover:text-primary transition-colors">
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
    if (segments.length > 2) {
      const parentPath = `/${segments.slice(0, segments.length - 1).join('/')}`;
      router.push(parentPath);
    } else {
      router.back();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-4">
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
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
