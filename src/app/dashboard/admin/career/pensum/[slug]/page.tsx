
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, GraduationCap, DollarSign, Clock, Award } from "lucide-react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';


interface Career {
  id?: string;
  nombre: string;
  slug: string;
  descripcionGeneral: string;
  perfilProfesional: string;
  imagenURL: string;
  duracionCiclo: string;
  modalidad: string;
  inversion: number;
  titulo: string;
  ciclos: { numero: number; materias: { nombre: string; codigo?: string; creditos: number }[] }[];
}


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};


export default function PensumDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [program, setProgram] = useState<Career | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
        const q = query(careersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setProgram(null);
        } else {
          const programDoc = querySnapshot.docs[0];
          setProgram({ id: programDoc.id, ...programDoc.data() } as Career);
        }
      } catch (error) {
        console.error("Error fetching program details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgram();
  }, [slug]);

  if (isLoading) {
    return <div className="text-center p-8">Cargando pensum...</div>;
  }

  if (!program) {
    notFound();
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Pensum de ${program.nombre}`}
        description="Visualiza el plan de estudios completo de este programa."
        icon={<BookOpen className="h-8 w-8 text-primary" />}
        backPath="/dashboard/admin/career"
      />

      <Card className="overflow-hidden">
        <div className="relative h-64 w-full">
          <Image
            src={program.imagenURL}
            alt={`Imagen de ${program.nombre}`}
            fill
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <CardContent className="p-6 space-y-2">
            <h2 className="text-2xl font-bold text-primary">{program.nombre}</h2>
            <p className="text-gray-700 leading-relaxed">{program.descripcionGeneral}</p>
             <Button asChild className="mt-4">
                <Link href={`/dashboard/admin/career/${program.slug}`}>Editar Carrera</Link>
             </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <CardTitle>Perfil Profesional</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{program.perfilProfesional}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <CardTitle>Información Clave</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Inversión por ciclo:</span>
                </div>
                <span className="text-gray-800 font-bold">{formatCurrency(program.inversion)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Duración:</span>
                </div>
                <span className="text-gray-800 font-bold">{program.duracionCiclo}</span>
            </div>
             <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span>Título Otorgado:</span>
                </div>
                <span className="text-gray-800 font-bold">{program.titulo}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <span>Créditos Totales:</span>
              </div>
              <span className="text-gray-800 font-bold">
                {program.ciclos.reduce((totalCreds: number, ciclo: any) => 
                    totalCreds + ciclo.materias.reduce((cycleCreds: number, materia: any) => cycleCreds + materia.creditos, 0), 0)
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan de Estudios (Pensum)</CardTitle>
          <CardDescription>Explora las materias que verás en cada ciclo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="ciclo-1">
            {program.ciclos.map((ciclo: any) => (
              <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Ciclo {ciclo.numero}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pt-2">
                    {ciclo.materias.map((materia: any) => (
                      <li key={materia.codigo || materia.nombre} className="flex justify-between items-center text-gray-700 p-3 rounded-md bg-gray-50 border">
                        <span>{materia.nombre}</span>
                        <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full">{materia.creditos} créditos</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
