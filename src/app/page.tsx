
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, Menu, Phone, MapPin, Mail, Linkedin, Instagram, Rocket, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import Autoplay from "embla-carousel-autoplay"
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);

interface Program {
    slug: string;
    title: string;
    description: string;
    image: string;
    imageHint: string;
}

const DEFAULT_HERO_IMAGE = "https://picsum.photos/seed/homepage-hero/1920/1080"; 

export default function HomePage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImageUrl, setHeroImageUrl] = useState<string>(DEFAULT_HERO_IMAGE);

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#programas", label: "Programas" },
    { href: "#mision-vision", label: "Nosotros" },
    { href: "#contacto", label: "Contacto" },
  ];

  useEffect(() => {
    const fetchPageData = async () => {
        setIsLoading(true);
        try {
            // Fetch Programs
            const careersCollection = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
            const careersSnapshot = await getDocs(careersCollection);
            const careersList = careersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    slug: data.slug || doc.id,
                    title: data.nombre,
                    description: data.descripcionGeneral,
                    image: data.imagenURL || `https://picsum.photos/seed/${doc.id}/600/400`,
                    imageHint: "university campus"
                }
            });
            setPrograms(careersList);

            // Fetch Hero Image
            const heroImageRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/siteSettings", "heroImage");
            const heroImageSnap = await getDoc(heroImageRef);
            if (heroImageSnap.exists() && heroImageSnap.data().imageUrl) {
                setHeroImageUrl(heroImageSnap.data().imageUrl);
            }

        } catch (error) {
            console.error("Error fetching page data: ", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchPageData();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-in-out',
    });
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="#inicio" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#002147]" />
            <span className="font-poppins text-xl font-bold text-[#002147]">
              Poli 2.0
            </span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Mobile Navigation Button */}
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

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="inicio"
          className="relative flex h-screen w-full items-center justify-center text-center text-white bg-cover bg-center"
        >
          <Image 
            src={heroImageUrl} 
            alt="Campus universitario" 
            fill 
            style={{objectFit: 'cover'}}
            priority
            data-ai-hint="university campus building"
          />
          <div className="absolute inset-0 z-0 bg-[#002147]/60" />
          <div className="relative z-20 flex flex-col items-center p-6" data-aos="fade-up">
            <h1 className="font-poppins text-5xl font-bold md:text-7xl">
              Forjamos el Futuro, Hoy
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl">
              Una educación de calidad que te prepara para los retos de un mundo en constante cambio.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                style={{ backgroundColor: "#004aad" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
              >
                <Link href="/register">Inscríbete Ahora</Link>
              </Button>
              <Button asChild
                variant="outline"
                className="rounded-full border-2 border-white bg-transparent px-8 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-white/10"
              >
                <Link href="/login">Portal de Estudiantes</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section id="programas" className="bg-white py-20">
          <div className="container mx-auto px-6" data-aos="fade-up">
            <h2 className="text-center font-poppins text-3xl font-bold text-gray-800 mb-4">
              Explora Nuestros Programas
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
                Ofrecemos programas académicos diseñados para las industrias del futuro, combinando teoría sólida con práctica intensiva.
            </p>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-80 w-full rounded-lg" />
                    <Skeleton className="h-80 w-full rounded-lg" />
                    <Skeleton className="h-80 w-full rounded-lg" />
                </div>
            ) : programs.length > 0 ? (
                <Carousel 
                    className="w-full"
                    plugins={programs.length > 3 ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : []}
                    opts={{ loop: programs.length > 3, align: "start" }}
                >
                  <CarouselContent className="-ml-4">
                    {programs.map((program, index) => (
                      <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                        <Card className="group flex h-full flex-col overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-2xl">
                           <div className="relative h-48 w-full overflow-hidden">
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
                                <CardTitle className="font-poppins text-xl">{program.title}</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{program.description}</p>
                           </CardContent>
                           <CardContent>
                                <Button asChild variant="link" className="p-0 text-primary font-semibold">
                                    <Link href={`/programas/${program.slug}`}>Ver más detalles &rarr;</Link>
                                </Button>
                           </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 transform text-white bg-black/30 hover:bg-black/50 border-none" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 transform text-white bg-black/30 hover:bg-black/50 border-none" />
                </Carousel>
            ) : (
                <p className="text-center text-muted-foreground">No hay programas disponibles en este momento.</p>
            )}
          </div>
        </section>

         {/* Mision y Vision Section */}
        <section id="mision-vision" className="bg-gray-50 py-20">
          <div className="container mx-auto px-6" data-aos="fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <Card className="rounded-xl border-none bg-white p-8 shadow-xl">
                <CardHeader className="flex items-center gap-4 p-0">
                  <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <Rocket className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-poppins text-2xl font-bold">Nuestra Misión</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-muted-foreground">
                    Formar profesionales íntegros y competentes, capaces de liderar la transformación digital y social a través de la innovación, el conocimiento aplicado y un profundo sentido ético, contribuyendo al desarrollo sostenible de la comunidad.
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-none bg-white p-8 shadow-xl">
                <CardHeader className="flex items-center gap-4 p-0">
                   <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <Eye className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-poppins text-2xl font-bold">Nuestra Visión</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-muted-foreground">
                    Ser una institución de educación superior líder y referente a nivel nacional e internacional, reconocida por su excelencia académica, su capacidad de innovación y su impacto positivo en la sociedad a través de la formación de líderes con visión global.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="inscripcion" className="bg-primary py-20 text-white">
          <div className="container mx-auto max-w-4xl px-6 text-center" data-aos="fade-up">
              <h2 className="font-poppins text-3xl font-bold">Únete a Nuestra Comunidad</h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Da el primer paso hacia una carrera exitosa. El proceso de inscripción es fácil y rápido.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full bg-white px-10 py-6 text-lg font-semibold text-primary shadow-lg transition-transform hover:scale-105 hover:bg-gray-100">
                  <Link href="/register">Inscríbete Ahora</Link>
              </Button>
          </div>
        </section>

      </main>

       {/* Footer */}
        <footer id="contacto" style={{ backgroundColor: "#0A0A23" }} className="text-white">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 md:grid-cols-3 md:text-left">
                    {/* Column 1: Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-poppins text-xl font-bold">Enlaces rápidos</h3>
                        <ul className="space-y-3">
                            <li><Link href="#inicio" className="text-gray-300 hover:text-white transition-colors">Inicio</Link></li>
                            <li><Link href="/programas" className="text-gray-300 hover:text-white transition-colors">Programas académicos</Link></li>
                            <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Noticias y anuncios</Link></li>
                            <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Calendario académico</Link></li>
                            <li><Link href="#contacto" className="text-gray-300 hover:text-white transition-colors">Contacto</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: Contact Us */}
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

                    {/* Column 3: Follow Us */}
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
