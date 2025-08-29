
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { carreraData } from "@/lib/seed"; 
import Image from "next/image";

// En una aplicación real, estos datos vendrían de una API o CMS.
// Por ahora, usamos los datos de ejemplo del seed.
const programData: { [key: string]: any } = {
  "tecnologia-en-comercio-exterior-y-negocios-internacionales": carreraData,
  "administracion-de-empresas": {
    nombre: "Administración de Empresas",
    descripcionGeneral: "Forma líderes con visión estratégica para la gestión eficiente y competitiva de organizaciones en un entorno globalizado.",
    perfilProfesional: "El Administrador de Empresas diseña, implementa y evalúa estrategias gerenciales en áreas como finanzas, marketing, talento humano y operaciones para asegurar el crecimiento y la sostenibilidad de la organización.",
    imagenURL: "/images/Administacion-de-Empresas.jpg",
    ciclos: [
      {
        numero: 1,
        materias: [
          { nombre: "Fundamentos de Administración", creditos: 3 },
          { nombre: "Matemáticas I", creditos: 3 },
          { nombre: "Contabilidad General", creditos: 2 },
        ]
      },
       {
        numero: 2,
        materias: [
          { nombre: "Procesos Administrativos", creditos: 3 },
          { nombre: "Estadística Descriptiva", creditos: 3 },
          { nombre: "Microeconomía", creditos: 2 },
        ]
      }
    ]
  },
};

export default function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const program = programData[params.slug] || Object.values(programData).find(p => p.slug === params.slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <PageHeader
            title={program.nombre}
            description="Conoce todos los detalles sobre este programa académico."
            icon={<BookOpen className="h-8 w-8 text-primary" />}
          />

          <Card className="overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src={program.imagenURL}
                alt={`Imagen de ${program.nombre}`}
                fill
                style={{ objectFit: "cover" }}
                className="brightness-90"
              />
            </div>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{program.descripcionGeneral}</p>
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
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Duración:</span>
                  <span className="text-gray-600">{program.duracionCiclo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Modalidad:</span>
                  <span className="text-gray-600">{program.modalidad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Créditos Totales:</span>
                  <span className="text-gray-600">
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
              <CardTitle>Plan de Estudios</CardTitle>
              <CardDescription>Explora las materias que verás en cada ciclo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {program.ciclos.map((ciclo: any) => (
                  <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                    <AccordionTrigger className="text-lg font-semibold">Ciclo {ciclo.numero}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 list-disc pl-5">
                        {ciclo.materias.map((materia: any) => (
                          <li key={materia.codigo || materia.nombre} className="text-gray-700">
                            {materia.nombre} <span className="text-sm text-gray-500">({materia.creditos} créditos)</span>
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
      </main>
    </div>
  );
}
