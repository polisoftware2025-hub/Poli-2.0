
"use client";

import { useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { sendAnnouncement } from "@/ai/flows/send-announcement-flow";

const announcementSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
    message: z.string().min(20, "El mensaje debe tener al menos 20 caracteres."),
    recipientGroup: z.string({ required_error: "Debes seleccionar un destinatario." }),
    channelEmail: z.boolean().default(true),
    channelPlatform: z.boolean().default(true),
}).refine(data => data.channelEmail || data.channelPlatform, {
    message: "Debes seleccionar al menos un canal de envío.",
    path: ["channelEmail"],
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      recipientGroup: undefined,
      channelEmail: true,
      channelPlatform: true,
    },
  });
  
  const onSubmit = async (data: AnnouncementFormValues) => {
    setIsLoading(true);
    try {
      const resultHtml = await sendAnnouncement({
        title: data.title,
        message: data.message,
        recipientGroup: data.recipientGroup,
      });

      console.log("Announcement HTML generated:", resultHtml);
      // En una aplicación real, aquí se enviaría el HTML por correo o se guardaría como notificación.
      
      toast({
        title: "Anuncio Enviado",
        description: "El anuncio ha sido procesado y se enviará a los destinatarios seleccionados.",
      });
      form.reset();

    } catch (error) {
      console.error("Error sending announcement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el anuncio. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Enviar Notificaciones y Anuncios"
        description="Comunica información importante a la comunidad académica."
        icon={<Send className="h-8 w-8 text-primary" />}
      />

      <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                    <CardTitle>Crear Anuncio</CardTitle>
                    <CardDescription>
                        Redacta el mensaje y selecciona los destinatarios. El sistema lo enviará a través de los canales correspondientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <Label>Título del Anuncio</Label>
                            <FormControl>
                                <Input placeholder="Ej: Cierre de la plataforma por mantenimiento" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Contenido del Mensaje</Label>
                                <FormControl>
                                <Textarea id="message" placeholder="Escribe aquí el cuerpo del anuncio..." rows={8} {...field}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="recipientGroup"
                            render={({ field }) => (
                                <FormItem>
                                <Label>Destinatarios</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar un grupo..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Toda la comunidad">Toda la comunidad</SelectItem>
                                        <SelectItem value="Todos los estudiantes">Todos los estudiantes</SelectItem>
                                        <SelectItem value="Todos los docentes">Todos los docentes</SelectItem>
                                        <SelectItem value="Carrera: Ingeniería de Sistemas">Carrera: Ingeniería de Sistemas</SelectItem>
                                        <SelectItem value="Grupo: CD-001 (Cálculo)">Grupo: CD-001 (Cálculo)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <div>
                            <Label>Canales de Envío</Label>
                            <div className="flex items-center space-x-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="channelEmail"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <Label className="font-normal">Correo Electrónico</Label>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="channelPlatform"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <Label className="font-normal">Plataforma (Notificación)</Label>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormMessage>{form.formState.errors.channelEmail?.message}</FormMessage>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Enviando..." : (
                                <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Anuncio
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </form>
          </Form>
      </Card>
    </div>
  );
}
