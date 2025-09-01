
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Archive } from "lucide-react"
import { PageHeader } from "@/components/page-header"

const allNotifications = [
    { id: '1', title: "¡Pago validado!", description: "El pago de matrícula de Laura Gómez ha sido validado.", time: "hace 10 minutos", read: false },
    { id: '2', title: "Nueva solicitud de preinscripción", description: "David Martínez ha enviado una solicitud de preinscripción.", time: "hace 2 horas", read: false },
    { id: '3', title: "Reporte de Deserción Generado", description: "El reporte de deserción para 2024-1 ha sido generado.", time: "hace 1 día", read: true },
    { id: '4', title: "Recordatorio: Pagos por Vencer", description: "Hay 23 matrículas que vencen en los próximos 7 días.", time: "hace 2 días", read: true },
];

export default function GestorNotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Notificaciones"
        description="Gestiona y revisa todas tus alertas y notificaciones del sistema."
        icon={<Bell className="h-8 w-8 text-primary" />}
      />

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
