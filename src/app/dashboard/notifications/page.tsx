
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Archive } from "lucide-react"

const allNotifications = [
    { id: '1', title: "¡Pago Liberado!", description: "Tu pago de la matrícula ha sido procesado exitosamente.", time: "hace 10 minutos", read: false },
    { id: '2', title: "Nueva Calificación Disponible", description: "Tu nota para el parcial de Cálculo Diferencial ha sido publicada.", time: "hace 2 horas", read: false },
    { id: '3', title: "Recordatorio de Tarea", description: "La entrega del Prototipo de IA es mañana.", time: "hace 1 día", read: true },
    { id: '4', title: "Anuncio del Campus", description: "El próximo lunes no habrá clases por día festivo.", time: "hace 2 días", read: true },
    { id: '5', title: "Foro Actualizado", description: "El docente ha respondido en el foro de 'Base de Datos'.", time: "hace 3 días", read: true },
    { id: '6', title: "Cambio de Horario", description: "La clase de 'Pruebas y Mantenimiento' ha sido reprogramada.", time: "hace 4 días", read: true },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                Notificaciones
              </CardTitle>
              <CardDescription className="font-poppins text-gray-600">
                Gestiona y revisa todas tus alertas y notificaciones.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between p-4 border-b">
                <TabsList>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="unread">No Leídas</TabsTrigger>
                </TabsList>
                <Button variant="outline">
                    <Archive className="mr-2 h-4 w-4" />
                    Archivar Seleccionadas
                </Button>
            </div>
            <TabsContent value="all" className="m-0">
               <div className="divide-y divide-border">
                   {allNotifications.map(notification => (
                       <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                           <Checkbox id={`notif-${notification.id}`} className="mt-1.5"/>
                           <div className="grid gap-1.5 flex-1">
                               <label htmlFor={`notif-${notification.id}`} className={`font-semibold ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                                   {notification.title}
                               </label>
                               <p className="text-sm text-muted-foreground">{notification.description}</p>
                               <p className="text-xs text-muted-foreground">{notification.time}</p>
                           </div>
                           {!notification.read && <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
                       </div>
                   ))}
               </div>
            </TabsContent>
            <TabsContent value="unread" className="m-0">
                <div className="divide-y divide-border">
                   {allNotifications.filter(n => !n.read).map(notification => (
                       <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                           <Checkbox id={`notif-unread-${notification.id}`} className="mt-1.5"/>
                           <div className="grid gap-1.5 flex-1">
                               <label htmlFor={`notif-unread-${notification.id}`} className="font-semibold text-gray-800">
                                   {notification.title}
                               </label>
                               <p className="text-sm text-muted-foreground">{notification.description}</p>
                               <p className="text-xs text-muted-foreground">{notification.time}</p>
                           </div>
                           <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                       </div>
                   ))}
               </div>
               {allNotifications.filter(n => !n.read).length === 0 && (
                   <div className="p-6 text-center text-muted-foreground">
                       <p>No tienes notificaciones sin leer.</p>
                   </div>
               )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

    