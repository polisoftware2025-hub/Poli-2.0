
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, GraduationCap, Menu, Phone, Mail, MapPin, Linkedin, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicThemeHandler } from "@/components/ui/public-theme-handler";
import { PublicThemeToggle } from "@/components/ui/public-theme-toggle";

interface Program {
  slug: string;
  title: string;
  description: string;
  image: string;
  imageHint: string;
}


const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);

export default function ProgramsListPage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
    { href: "/#contacto", label: "Contacto" },
  ];
  
  useEffect(() => {
    const fetchPrograms = async () => {
        setIsLoading(true);
        try {
            const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
            const careersSnapshot = await getDocs(careersCollection);
            const careersList = careersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    slug: data.slug || doc.id,
                    title: data.nombre,
                    description: data.descripcionGeneral,
                    image: data.imagenURL || "https://placehold.co/600x400/002147/FFFFFF?text=Poli",
                    imageHint: "university campus"
                } as Program;
            });
            setPrograms(careersList);
        } catch (error) {
            console.error("Error fetching programs: ", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchPrograms();
  }, []);

  return (
    <div className="bg-muted min-h-screen flex flex-col font-poppins">
      <PublicThemeHandler />
       <header className="sticky top-0 z-50 w-full bg-background shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-poppins text-xl font-bold text-foreground">
              Poli 2.0
            </span>
          </Link>

          <nav className="hidden items-center space-x-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-poppins text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <PublicThemeToggle />
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
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <span className="font-poppins text-lg font-bold text-foreground">Poli 2.0</span>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
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
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                       <Card key={i} className="overflow-hidden flex flex-col">
                           <Skeleton className="h-48 w-full"/>
                           <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
                           <CardContent className="flex-grow"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-2/3 mt-2"/></CardContent>
                           <CardFooter><Skeleton className="h-10 w-full"/></CardFooter>
                       </Card>
                    ))
                ) : (
                    programs.map((program) => (
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
                    ))
                )}
            </div>
        </div>
      </main>

      <footer id="contacto" className="bg-card text-card-foreground border-t">
        <div className="container mx-auto px-6 py-16">
            <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 md:grid-cols-3 md:text-left">
                <div className="space-y-4">
                    <h3 className="font-poppins text-xl font-bold">Enlaces rápidos</h3>
                    <ul className="space-y-3">
                        <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Inicio</Link></li>
                        <li><Link href="/programas" className="text-muted-foreground hover:text-foreground transition-colors">Programas académicos</Link></li>
                        <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Noticias y anuncios</Link></li>
                        <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Calendario académico</Link></li>
                        <li><Link href="/#contacto" className="text-muted-foreground hover:text-foreground transition-colors">Contacto</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-poppins text-xl font-bold">Contáctanos</h3>
                     <ul className="space-y-3">
                        <li className="flex items-center justify-center gap-3 md:justify-start">
                            <MapPin className="h-5 w-5 shrink-0" />
                            <span className="text-muted-foreground text-sm">Calle 123 #45-67, Bogotá, Colombia</span>
                        </li>
                        <li className="flex items-center justify-center gap-3 md:justify-start">
                            <Phone className="h-5 w-5 shrink-0" />
                            <span className="text-muted-foreground text-sm">+57 310 456 7890</span>
                        </li>
                         <li className="flex items-center justify-center gap-3 md:justify-start">
                            <Mail className="h-5 w-5 shrink-0" />
                            <span className="text-muted-foreground text-sm">info@politecnico20.edu.co</span>
                        </li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-poppins text-xl font-bold">Síguenos</h3>
                    <div className="flex justify-center md:justify-start items-center space-x-4">
                       <a href="#" className="text-muted-foreground hover:text-[#1877F2] transition-colors" aria-label="Facebook"><FacebookIcon className="h-7 w-7" /></a>
                        <a href="#" className="text-muted-foreground hover:text-[#E1306C] transition-colors" aria-label="Instagram"><Instagram className="h-7 w-7" /></a>
                        <a href="#" className="text-muted-foreground hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn"><Linkedin className="h-7 w-7" /></a>
                    </div>
                </div>
            </div>
        </div>
        <div className="border-t border-border py-6">
            <div className="container mx-auto text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Poli 2.0. Todos los derechos reservados.</div>
        </div>
    </footer>
    </div>
  );
}
