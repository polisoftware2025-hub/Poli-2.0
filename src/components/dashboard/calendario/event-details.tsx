
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CalendarEvent } from "@/app/dashboard/calendario/page";

interface EventDetailsProps {
  event: CalendarEvent;
}

const categoryClasses: { [key: string]: string } = {
  "Académico": "text-blue-600",
  "Inscripciones": "text-green-600",
  "Exámenes": "text-yellow-600",
  "Receso": "text-purple-600",
  "Festivo": "text-red-600",
};

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-primary">Ver detalle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event.titulo}</DialogTitle>
          <DialogDescription>
            {new Date(event.fecha.seconds * 1000).toLocaleDateString('es-ES', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-sm text-gray-700">{event.descripcion}</p>
            <div>
                <span className="font-semibold">Categoría: </span>
                <span className={categoryClasses[event.categoria] || 'text-gray-500'}>
                    {event.categoria}
                </span>
            </div>
        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
