"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Archive } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    timestamp: Date;
}

export default function GestorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
        setIsLoading(true);
        const fetchedNotifications: Notification[] = [];
        try {
            // Fetch pending pre-registrations
            const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
            const pendingStudentsQuery = query(studentsRef, where("estado", "==", "pendiente"));
            const pendingStudentsSnap = await getDocs(pendingStudentsQuery);
            pendingStudentsSnap.forEach(doc => {
                const data = doc.data();
                fetchedNotifications.push({
                    id: doc.id,
                    title: "Nueva solicitud de preinscripción",
                    description: `${data.nombreCompleto || 'Un aspirante'} ha enviado una solicitud de preinscripción.`,
                    timestamp: data.fechaRegistro.toDate(),
                    time: formatDistanceToNow(data.fechaRegistro.toDate(), { addSuffix: true, locale: es }),
                    read: false, // Assume unread for simplicity
                });
            });

            // Fetch payments pending validation
            const paymentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos");
            const pendingPaymentsQuery = query(paymentsRef, where("estado", "==", "pendiente-validacion"));
            const pendingPaymentsSnap = await getDocs(pendingPaymentsQuery);
            
            const studentIds = pendingPaymentsSnap.docs.map(doc => doc.data().idEstudiante);
            const userNames: Record<string, string> = {};
            if(studentIds.length > 0){
                const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
                const usersQuery = query(usersRef, where("__name__", "in", studentIds));
                const usersSnap = await getDocs(usersQuery);
                usersSnap.forEach(doc => {
                    userNames[doc.id] = doc.data().nombreCompleto;
                });
            }

            pendingPaymentsSnap.forEach(doc => {
                const data = doc.data();
                const studentName = userNames[data.idEstudiante] || 'un estudiante';
                 fetchedNotifications.push({
                    id: doc.id,
                    title: "Pago por validar",
                    description: `Se ha recibido un comprobante de pago de ${studentName}.`,
                    timestamp: data.fechaGeneracion.toDate(),
                    time: formatDistanceToNow(data.fechaGeneracion.toDate(), { addSuffix: true, locale: es }),
                    read: false,
                });
            });

            // Sort notifications by date
            fetchedNotifications.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

            setNotifications(fetchedNotifications);

        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchNotifications();
  }, []);

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
                    <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">No Leídas ({notifications.filter(n => !n.read).length})</TabsTrigger>
                </TabsList>
                <Button variant="outline">
                    <Archive className="mr-2 h-4 w-4" />
                    Archivar Seleccionadas
                </Button>
            </div>
            <TabsContent value="all" className="m-0">
               <div className="divide-y divide-border">
                   {isLoading ? (
                       Array.from({length: 3}).map((_, i) => (
                           <div key={i} className="flex items-start gap-4 p-4">
                               <Skeleton className="h-5 w-5 mt-1.5"/>
                               <div className="flex-1 space-y-2">
                                   <Skeleton className="h-5 w-1/3"/>
                                   <Skeleton className="h-4 w-2/3"/>
                                   <Skeleton className="h-3 w-1/4"/>
                               </div>
                           </div>
                       ))
                   ) : notifications.length > 0 ? (
                       notifications.map(notification => (
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
                       ))
                   ) : (
                       <p className="p-6 text-center text-muted-foreground">No tienes notificaciones.</p>
                   )}
               </div>
            </TabsContent>
            <TabsContent value="unread" className="m-0">
                <div className="divide-y divide-border">
                   {isLoading ? (
                       Array.from({length: 2}).map((_, i) => (
                           <div key={i} className="flex items-start gap-4 p-4">
                               <Skeleton className="h-5 w-5 mt-1.5"/>
                               <div className="flex-1 space-y-2">
                                   <Skeleton className="h-5 w-1/3"/>
                                   <Skeleton className="h-4 w-2/3"/>
                                   <Skeleton className="h-3 w-1/4"/>
                               </div>
                           </div>
                       ))
                   ) : notifications.filter(n => !n.read).length > 0 ? (
                       notifications.filter(n => !n.read).map(notification => (
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
                       ))
                   ) : (
                       <div className="p-6 text-center text-muted-foreground">
                           <p>No tienes notificaciones sin leer.</p>
                       </div>
                   )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
