"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar as CalendarIcon, PlusCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { AddEventForm } from "@/components/dashboard/calendario/add-event-form";
import { EventDetails } from "@/components/dashboard/calendario/event-details";

export interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: Timestamp;
  categoria: "Académico" | "Inscripciones" | "Exámenes" | "Receso" | "Festivo";
}

const categoryColors: { [key: string]: string } = {
  "Académico": "bg-blue-100 text-blue-800 border-blue-200",
  "Inscripciones": "bg-green-100 text-green-800 border-green-200",
  "Exámenes": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Receso": "bg-purple-100 text-purple-800 border-purple-200",
  "Festivo": "bg-red-100 text-red-800 border-red-200",
};

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);

    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/calendario");
        const q = query(eventsRef, orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);

        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as CalendarEvent));

        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [isFormOpen]); // Refetch events when form is closed

  const canAddEvent = userRole === 'admin' || userRole === 'docente';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendario Académico"
        description="Consulta las fechas importantes, festivos y eventos académicos."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />

      <div className="flex justify-end">
        {canAddEvent && (
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Evento
          </Button>
        )}
      </div>
      
      <AddEventForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />

      {isLoading ? (
        <div className="text-center text-muted-foreground">Cargando eventos...</div>
      ) : error ? (
        <div className="text-center text-destructive">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400"/>
            <h3 className="mt-2 text-lg font-medium">No hay eventos en el calendario académico</h3>
            <p className="mt-1 text-sm text-gray-500">Aún no se han añadido fechas importantes. Vuelve a consultar más tarde.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{event.titulo}</CardTitle>
                <CardDescription>
                  {new Date(event.fecha.seconds * 1000).toLocaleDateString('es-ES', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.descripcion}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${categoryColors[event.categoria] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {event.categoria}
                </div>
                <EventDetails event={event} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
