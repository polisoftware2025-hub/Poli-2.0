
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, Menu, Phone, MapPin, Mail, Linkedin, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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

const DEFAULT_HERO_IMAGE = "https://picsum.photos/1920/1080"; 

export default function HomePage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImageUrl, setHeroImageUrl] = useState<string>(DEFAULT_HERO_IMAGE);

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
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
                    image: data.imagenURL || "https://placehold.co/800x400/002147/FFFFFF?text=Poli+2.0",
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
    if (!carouselApi) {
      return;
    }
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-in-out',
    });
  }, []);

  const scrollToSlide = (index: number) => {
    carouselApi?.scrollTo(index);
  };
  
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
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        >
          <div className="absolute inset-0 z-0 bg-[#002147]/60" />
          <div className="relative z-20 flex flex-col items-center p-6">
            <h1 className="font-poppins text-5xl font-bold md:text-7xl">
              Somos Politécnico 2.0
            </h1>
            <p className="mt-4 text-lg md:text-xl">
              Tu futuro profesional comienza aquí.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                style={{ backgroundColor: "#004aad" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
              >
                <Link href="/login">Inicia Sesión</Link>
              </Button>
              <Button asChild
                style={{ backgroundColor: "#2ecc71" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600"
              >
                <Link href="/programas">Conoce Nuestros Programas</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section id="inscripcion" className="bg-white py-20">
          <div className="container mx-auto max-w-4xl px-6 text-center" data-aos="fade-up">
            <Card className="rounded-xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
              <CardContent className="p-0">
                <p className="font-poppins text-xl text-gray-700">
                  El Politécnico Internacional forma profesionales con calidad
                  y compromiso, preparados para los retos del mundo actual.
                </p>
                  <Button asChild size="lg" className="mt-6 rounded-full bg-[#004aad] px-10 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700">
                      <Link href="/register">Inscríbete</Link>
                  </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Programs Section */}
        <section id="programas" className="bg-gray-50 py-20">
          <div className="container mx-auto px-6" data-aos="fade-up" data-aos-delay="200">
            <h2 className="text-center font-poppins text-3xl font-bold text-gray-800 mb-12">
              Nuestros Programas Académicos
            </h2>
            {isLoading ? (
                <div className="w-full h-[500px]">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
            ) : programs.length > 0 ? (
                <Carousel 
                    setApi={setCarouselApi} 
                    className="w-full"
                    plugins={programs.length > 1 ? [Autoplay({ delay: 4000, stopOnInteraction: true })] : []}
                    opts={{
                        loop: programs.length > 1,
                        align: "start",
                    }}
                >
                  <CarouselContent>
                    {programs.map((program, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-[500px] w-full overflow-hidden rounded-lg">
                          <Image
                            src={program.image}
                            alt={`Imagen de ${program.title}`}
                            fill
                            style={{objectFit: 'cover'}}
                            className="brightness-50"
                            data-ai-hint={program.imageHint}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-full max-w-2xl rounded-lg bg-black/50 p-4 sm:p-8 text-center text-white backdrop-blur-sm">
                              <h3 className="font-poppins text-2xl sm:text-4xl font-bold">
                                {program.title}
                              </h3>
                              <p className="mt-2 sm:mt-4 text-base sm:text-lg">
                                {program.description}
                              </p>
                              <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
                                <Button asChild
                                  style={{ backgroundColor: "#004aad" }}
                                  className="px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
                                >
                                  <Link href="/register">Inscribirme</Link>
                                </Button>
                                <Button asChild
                                  className="px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 bg-[#2ecc71] hover:bg-[#27ae60] active:bg-[#219150]"
                                >
                                   <Link href={`/programas/${program.slug}`}>Ver más</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 transform text-white bg-black/30 hover:bg-black/50 border-none" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 transform text-white bg-black/30 hover:bg-black/50 border-none" />
                </Carousel>
            ) : (
                <p className="text-center text-muted-foreground">No hay programas disponibles en este momento.</p>
            )}
             <div className="mt-4 flex justify-center gap-2">
              {programs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    currentSlide === index ? "bg-[#004aad]" : "bg-gray-300"
                  }`}
                  aria-label={`Ir al programa ${index + 1}`}
                />
              ))}
            </div>
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
