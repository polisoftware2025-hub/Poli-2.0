"use client";

import { PageHeader } from "@/components/page-header";
import { Newspaper, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const announcements = [
  {
    id: "1",
    title: "Entrega de trabajos finales",
    date: "2025-08-15",
    content: "Recuerden que la entrega de los proyectos finales de todas las asignaturas es hasta el día 30 de agosto en el aula virtual correspondiente.",
  },
  {
    id: "2",
    title: "Actualización de Horarios de Consulta",
    date: "2025-08-12",
    content: "Se han actualizado los horarios de consulta para la materia de Cálculo. Por favor, revisen el calendario académico para más detalles.",
  },
  {
    id: "3",
    title: "Jornada de Bienestar Docente",
    date: "2025-08-10",
    content: "Invitamos a todos los docentes a participar en la jornada de bienestar que se realizará el próximo viernes en el auditorio principal.",
  },
  {
    id: "4",
    title: "Cierre de Plataforma por Mantenimiento",
    date: "2025-08-05",
    content: "La plataforma académica estará en mantenimiento el día sábado de 2:00 a.m. a 4:00 a.m. Agradecemos su comprensión.",
  }
];


export default function NewsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Noticias y Anuncios"
        description="Mantente al día con las últimas noticias y anuncios de la institución."
        icon={<Newspaper className="h-8 w-8 text-primary" />}
      />
      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
                <Card key={announcement.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{announcement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1">
                            <Calendar className="h-4 w-4"/>
                            <span>Publicado el {new Date(announcement.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {announcement.content}
                        </p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="link" className="p-0 h-auto">Ver más</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-16">
          <p>No hay noticias ni anuncios disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}
