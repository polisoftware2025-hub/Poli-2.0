
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, GraduationCap, Menu, Phone, Mail, MapPin, DollarSign, Clock,Award, Instagram, Linkedin } from "lucide-react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { notFound } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface Materia {
  nombre: string;
  codigo?: string;
  creditos: number;
}
interface Ciclo {
  numero: number;
  materias: Materia[];
}
interface Career {
  nombre: string;
  slug: string;
  descripcionGeneral: string;
  perfilProfesional: string;
  imagenURL: string;
  duracionCiclo: string;
  modalidad: string;
  titulo: string;
  precioPorCiclo?: { [key: string]: number };
  ciclos: Ciclo[];
}

const formatCurrency = (value?: number) => {
  if (value === undefined || isNaN(value)) return "No especificado";
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);


export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [program, setProgram] = useState<Career | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    const fetchProgram = async () => {
        setIsLoading(true);
        try {
            const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
            const q = query(careersRef, where("slug", "==", slug));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                notFound();
            } else {
                const programDoc = querySnapshot.docs[0];
                setProgram(programDoc.data() as Career);
            }
        } catch (error) {
            console.error("Error fetching program:", error);
            notFound();
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchProgram();
  }, [slug]);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
    { href: "/#contacto", label: "Contacto" },
  ];

  if (isLoading) {
      return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center">
            <p>Cargando programa...</p>
            <div className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
        </div>
      )
  }

  if (!program) {
    return notFound();
  }
  
  const firstCyclePrice = program.precioPorCiclo ? program.precioPorCiclo["1"] : undefined;


  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#002147]" />
            <span className="font-poppins text-xl font-bold text-[#002147]">
              Poli 2.0
            </span>
          </Link>

          <nav className="hidden items-center space-x-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-poppins text-sm font-medium text-gray-600 transition-colors hover:text-[#004aad]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle Menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-background p-4 text-foreground">
                <SheetTitle className="sr-only">Navegación Móvil</SheetTitle>
                 <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-[#002147]" />
                        <span className="font-poppins text-lg font-bold text-[#002147]">Poli 2.0</span>
                    </div>
                </div>
                <nav className="flex flex-col items-start space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="font-poppins text-lg font-medium transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col gap-8">
          <PageHeader
            title={program.nombre}
            description="Conoce todos los detalles sobre este programa académico."
            icon={<BookOpen className="h-8 w-8 text-primary" />}
            breadcrumbs={[{ name: program.nombre, href: `/programas/${program.slug}`}]}
          />

          <Card className="overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src={program.imagenURL || "/images/default-hero.jpg"}
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
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Inversión por ciclo:</span>
                  </div>
                  <span className="text-gray-800 font-bold">{formatCurrency(firstCyclePrice)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Duración:</span>
                  </div>
                  <span className="text-gray-600">{program.duracionCiclo}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span>Título Otorgado:</span>
                  </div>
                  <span className="text-gray-600">{program.titulo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                     <GraduationCap className="h-5 w-5 text-purple-600" />
                     <span>Créditos Totales:</span>
                  </div>
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
              <CardTitle>Plan de Estudios (Pensum)</CardTitle>
              <CardDescription>Explora las materias que verás en cada ciclo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {program.ciclos.map((ciclo: any) => (
                  <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Ciclo {ciclo.numero}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-3 pt-2">
                        {ciclo.materias.map((materia: any) => (
                          <li key={materia.codigo || materia.nombre} className="flex justify-between items-center text-gray-700 p-2 rounded-md hover:bg-gray-100">
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
      </main>

       <footer id="contacto" style={{ backgroundColor: "#0A0A23" }} className="text-white">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 md:grid-cols-3 md:text-left">
                    <div className="space-y-4">
                        <h3 className="font-poppins text-xl font-bold">Enlaces rápidos</h3>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Inicio</Link></li>
                            <li><Link href="/programas" className="text-gray-300 hover:text-white transition-colors">Programas académicos</Link></li>
                            <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Noticias y anuncios</Link></li>
                            <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Calendario académico</Link></li>
                            <li><Link href="/#contacto" className="text-gray-300 hover:text-white transition-colors">Contacto</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-poppins text-xl font-bold">Contáctanos</h3>
                         <ul className="space-y-3">
                            <li className="flex items-center justify-center gap-3 md:justify-start">
                                <MapPin className="h-5 w-5 shrink-0" />
                                <span className="text-gray-300 text-sm">Calle 123 #45-67, Bogotá, Colombia</span>
                            </li>
                            <li className="flex items-center justify-center gap-3 md:justify-start">
                                <Phone className="h-5 w-5 shrink-0" />
                                <span className="text-gray-300 text-sm">+57 310 456 7890</span>
                            </li>
                             <li className="flex items-center justify-center gap-3 md:justify-start">
                                <Mail className="h-5 w-5 shrink-0" />
                                <span className="text-gray-300 text-sm">info@politecnico20.edu.co</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-poppins text-xl font-bold">Síguenos</h3>
                        <div className="flex justify-center md:justify-start items-center space-x-4">
                           <a href="#" className="text-white hover:text-[#1877F2] transition-colors" aria-label="Facebook">
                                <FacebookIcon className="h-7 w-7" />
                            </a>
                            <a href="#" className="text-white hover:text-[#E1306C] transition-colors" aria-label="Instagram">
                                <Instagram className="h-7 w-7" />
                            </a>
                            <a href="#" className="text-white hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
                                <Linkedin className="h-7 w-7" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-700 py-6">
                <div className="container mx-auto text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Politécnico 2.0. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    </div>
  );
}
