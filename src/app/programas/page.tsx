
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const programs = [
    {
      slug: "administracion-de-empresas",
      title: "Administración de Empresas",
      description:
        "Forma líderes con visión estratégica para gestionar organizaciones.",
      image: "/images/Administacion-de-Empresas.jpg",
      imageHint: "business students",
    },
    {
      slug: "contaduria-publica",
      title: "Contaduría Pública",
      description:
        "Prepara expertos en el control financiero y la normativa contable.",
      image: "/images/carousel/accounting-finance.jpg",
      imageHint: "accounting finance",
    },
    {
      slug: "mercadeo-y-publicidad",
      title: "Mercadeo y Publicidad",
      description:
        "Desarrolla estrategias creativas para posicionar marcas y productos.",
      image: "/images/carousel/marketing-team.jpg",
      imageHint: "marketing team",
    },
    {
      slug: "ingenieria-de-sistemas",
      title: "Ingeniería de Sistemas",
      description:
        "Crea soluciones tecnológicas innovadoras para optimizar procesos.",
      image: "/images/carousel/software-development.jpg",
      imageHint: "software development",
    },
];

export default function ProgramsListPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Nuestra Oferta Académica"
                description="Explora los programas diseñados para tu futuro profesional."
                icon={<BookCopy className="h-8 w-8 text-primary" />}
            />
            
            <Card>
                <CardHeader className="text-center">
                    <GraduationCap className="h-12 w-12 mx-auto text-primary"/>
                    <CardTitle className="text-3xl mt-4">Forjando el Futuro</CardTitle>
                    <CardDescription className="max-w-2xl mx-auto">
                        En el Politécnico 2.0, estamos comprometidos con una educación de calidad que responde a las demandas del mercado global. Nuestros programas combinan una sólida fundamentación teórica con un enfoque práctico, preparándote para enfrentar los desafíos del mañana.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program) => (
                    <Card key={program.slug} className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col">
                        <div className="relative h-48 w-full">
                            <Image
                                src={program.image}
                                alt={`Imagen de ${program.title}`}
                                fill
                                style={{objectFit: 'cover'}}
                                className="transition-transform duration-500 group-hover:scale-105"
                                data-ai-hint={program.imageHint}
                            />
                        </div>
                         <CardHeader>
                            <CardTitle className="text-xl">{program.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{program.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/programas/${program.slug}`}>
                                    Ver Detalles del Programa
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
