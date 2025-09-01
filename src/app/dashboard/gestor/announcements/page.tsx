"use client";

import { PageHeader } from "@/components/page-header";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AnnouncementsPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Enviar Notificaciones y Anuncios"
        description="Comunica información importante a la comunidad académica."
        icon={<Send className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Crear Anuncio</CardTitle>
          <CardDescription>
            Redacta el mensaje y selecciona los destinatarios. El sistema lo enviará a través de los canales correspondientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Anuncio</Label>
              <Input id="title" placeholder="Ej: Cierre de la plataforma por mantenimiento" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Contenido del Mensaje</Label>
                <Textarea id="message" placeholder="Escribe aquí el cuerpo del anuncio..." rows={8} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                    <Label htmlFor="recipient">Destinatarios</Label>
                    <Select>
                        <SelectTrigger id="recipient">
                            <SelectValue placeholder="Seleccionar un grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toda la comunidad</SelectItem>
                            <SelectItem value="students">Todos los estudiantes</SelectItem>
                            <SelectItem value="teachers">Todos los docentes</SelectItem>
                            <SelectItem value="career-sistemas">Carrera: Ingeniería de Sistemas</SelectItem>
                            <SelectItem value="group-cd-001">Grupo: CD-001 (Cálculo)</SelectItem>
                        </SelectContent>
                    </Select>
               </div>
               <div className="space-y-2">
                    <Label>Canales de Envío</Label>
                    <div className="flex items-center space-x-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="channel-email" defaultChecked/>
                            <Label htmlFor="channel-email">Correo Electrónico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="channel-platform" defaultChecked/>
                            <Label htmlFor="channel-platform">Plataforma (Notificación)</Label>
                        </div>
                    </div>
               </div>
            </div>

            <div className="flex justify-end pt-4">
                 <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Anuncio
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
