
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Download, ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePdf } from "@/lib/invoice-generator";

interface Invoice {
    id: string;
    idEstudiante: string;
    ciclo: number;
    monto: number;
    estado: string;
    fechaPago: Timestamp;
}

interface StudentInfo {
    nombreCompleto: string;
    identificacion: string;
    carreraNombre: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function PaymentSuccessPage() {
    const params = useParams();
    const invoiceId = params.invoiceId as string;
    const router = useRouter();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!invoiceId) return;

        const fetchPaymentDetails = async () => {
            setIsLoading(true);
            try {
                const invoiceRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos", invoiceId);
                const invoiceSnap = await getDoc(invoiceRef);

                if (!invoiceSnap.exists() || invoiceSnap.data().estado !== 'pagado') {
                    router.push('/dashboard/pagos'); // Redirect if not paid
                    return;
                }
                const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
                setInvoice(invoiceData);

                // Fetch student info
                const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", invoiceData.idEstudiante);
                const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", invoiceData.idEstudiante);
                const [userSnap, studentSnap] = await Promise.all([getDoc(userRef), getDoc(studentRef)]);
                
                let carreraNombre = "N/A";
                if(studentSnap.exists()){
                     const studentData = studentSnap.data();
                     if (studentData.carreraId) {
                         const careerRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", studentData.carreraId);
                         const careerSnap = await getDoc(careerRef);
                         if(careerSnap.exists()){
                            carreraNombre = careerSnap.data().nombre;
                         }
                     }
                }
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setStudentInfo({
                        nombreCompleto: userData.nombreCompleto,
                        identificacion: userData.identificacion,
                        carreraNombre: carreraNombre,
                    });
                }
            } catch (error) {
                console.error("Error fetching payment details:", error);
                router.push('/dashboard/pagos');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [invoiceId, router]);
    
    const handleDownload = () => {
        if (!invoice || !studentInfo) return;
        generateInvoicePdf(invoice, studentInfo);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <Skeleton className="h-80 w-full max-w-lg"/>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
            <Card className="w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                        ¡Pago Completado!
                    </CardTitle>
                    <CardDescription className="font-poppins text-gray-600 pt-2">
                        Tu transacción ha sido procesada exitosamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-4xl font-bold text-gray-800">{formatCurrency(invoice?.monto || 0)}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>ID de Factura: {invoice?.id}</p>
                        <p>Pagado el: {invoice?.fechaPago.toDate().toLocaleString('es-ES')}</p>
                    </div>
                     <Button className="w-full mt-4" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Factura
                    </Button>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/dashboard/pagos">
                           <ArrowLeft className="mr-2 h-4 w-4"/>
                           Volver a Mis Pagos
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
