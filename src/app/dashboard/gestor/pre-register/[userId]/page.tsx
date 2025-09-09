
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { User, Phone, BookOpen, Check, X, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, writeBatch, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { processStudentEnrollment } from "@/ai/flows/enroll-student-flow";

interface ApplicantData {
  id: string;
  // User data
  nombreCompleto: string;
  correo: string;
  telefono: string;
  direccion: string;
  tipoIdentificacion: string;
  identificacion: string;
  fechaNacimiento: Date;
  // Student data
  carreraId: string;
  grupo: string; // Will hold the group name (codigoGrupo)
  sedeId: string;
  fechaRegistro: Date;
  estado: "pendiente" | "aprobado" | "rechazado";
  // Enriched data
  carreraNombre?: string;
  sedeNombre?: string;
}

const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground sm:mt-0">{value || "N/A"}</dd>
  </div>
);

export default function PreRegisterDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) return;

    const fetchApplicantData = async () => {
      setIsLoading(true);
      try {
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          notFound();
          return;
        }
        
        const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");
        const studentQuery = query(studentsRef, where("usuarioId", "==", userId));
        const studentQuerySnapshot = await getDocs(studentQuery);

        if (studentQuerySnapshot.empty) {
            notFound();
            return;
        }

        const studentSnap = studentQuerySnapshot.docs[0];
        const userData = userSnap.data();
        const studentData = studentSnap.data();

        let carreraNombre = "N/A";
        if(studentData.carreraId) {
            const carreraRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", studentData.carreraId);
            const carreraSnap = await getDoc(carreraRef);
            if (carreraSnap.exists()) {
                carreraNombre = carreraSnap.data().nombre;
            }
        }
        
        let sedeNombre = "N/A";
        if(studentData.sedeId) {
            const sedeRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes", studentData.sedeId);
            const sedeSnap = await getDoc(sedeRef);
            if(sedeSnap.exists()) {
                sedeNombre = sedeSnap.data().nombre;
            }
        }
        
        let grupoNombre = "N/A";
        if (studentData.grupo) {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", studentData.grupo);
            const grupoSnap = await getDoc(grupoRef);
            if (grupoSnap.exists()) {
                grupoNombre = grupoSnap.data().codigoGrupo;
            }
        }

        // Ensure dates are JavaScript Date objects
        const fechaNacimiento = userData.fechaNacimiento?.toDate ? userData.fechaNacimiento.toDate() : new Date();
        const fechaRegistro = studentData.fechaRegistro?.toDate ? studentData.fechaRegistro.toDate() : new Date();

        setApplicantData({
            id: userId,
            nombreCompleto: userData.nombreCompleto,
            correo: userData.correo,
            telefono: userData.telefono,
            direccion: userData.direccion,
            tipoIdentificacion: userData.tipoIdentificacion,
            identificacion: userData.identificacion,
            fechaNacimiento,
            carreraId: studentData.carreraId,
            grupo: grupoNombre,
            sedeId: studentData.sedeId,
            fechaRegistro,
            estado: studentData.estado,
            carreraNombre,
            sedeNombre,
        });

      } catch (error) {
        console.error("Error fetching applicant data:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la información del aspirante." });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicantData();
  }, [userId, toast]);
  
  const handleApprove = async () => {
    startTransition(async () => {
        try {
            const result = await processStudentEnrollment({ studentId: userId });
            if (result.success) {
                toast({ title: "Éxito", description: result.message });
                router.push("/dashboard/gestor/pre-register");
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error al Aprobar", description: error.message });
        }
    });
  }

  const handleReject = async () => {
      startTransition(async () => {
        try {
            const batch = writeBatch(db);
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
            
            batch.update(studentRef, { estado: 'rechazado' });
            batch.update(userRef, { estado: 'rechazado' });
            
            await batch.commit();

            toast({ title: "Solicitud Rechazada", description: "El aspirante ha sido marcado como rechazado." });
            router.push("/dashboard/gestor/pre-register");
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error al Rechazar", description: error.message });
        }
      });
  }
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Detalle del Aspirante"
        description={`Revisa la información de ${applicantData?.nombreCompleto || '...'}.`}
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
        backPath="/dashboard/gestor/pre-register"
      />

      {isLoading ? (
        <Card>
          <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter>
              <Skeleton className="h-10 w-48" />
          </CardFooter>
        </Card>
      ) : !applicantData ? (
        notFound()
      ) : (
        <Card>
          <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle className="text-2xl">{applicantData.nombreCompleto}</CardTitle>
                      <CardDescription>
                          Solicitud recibida el {applicantData.fechaRegistro.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </CardDescription>
                  </div>
                  <Button>Descargar Documentos</Button>
              </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Información Personal</h3>
              </div>
              <dl className="space-y-4">
                <DetailItem label="Tipo de Identificación" value={applicantData.tipoIdentificacion} />
                <DetailItem label="Número de Identificación" value={applicantData.identificacion} />
                <DetailItem label="Fecha de Nacimiento" value={applicantData.fechaNacimiento.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} />
              </dl>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Datos de Contacto</h3>
              </div>
              <dl className="space-y-4">
                <DetailItem label="Correo Personal" value={applicantData.correo} />
                <DetailItem label="Teléfono" value={applicantData.telefono} />
                <DetailItem label="Dirección" value={applicantData.direccion} />
              </dl>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Información Académica</h3>
              </div>
              <dl className="space-y-4">
                <DetailItem label="Carrera de Interés" value={applicantData.carreraNombre} />
                <DetailItem label="Sede" value={applicantData.sedeNombre} />
                 <DetailItem label="Grupo Seleccionado" value={applicantData.grupo} />
              </dl>
            </section>
          </CardContent>
          
          {applicantData.estado === 'pendiente' && (
              <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t">
                <div className="flex w-full justify-end gap-4">
                  <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" />
                     {isProcessing ? "Rechazando..." : "Rechazar Solicitud"}
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isProcessing}>
                    <Check className="mr-2 h-4 w-4" />
                     {isProcessing ? "Aprobando..." : "Aprobar Solicitud"}
                  </Button>
                </div>
              </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
