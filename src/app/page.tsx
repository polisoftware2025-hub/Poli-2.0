
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
import { GraduationCap, Menu, Phone, MapPin, Mail, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import Autoplay from "embla-carousel-autoplay"

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.88-1.59-1.92-2.3-4.4-2.17-6.83.08-1.55.54-3.09 1.38-4.34 1.3-1.92 3.57-3.17 5.9-3.22.42-.01.84-.01 1.25-.02v4.03c-.44 0-.88 0-1.32.02-1.07.03-2.14.41-2.98 1.15-.84.74-1.26 1.87-1.18 2.91.07.92.52 1.84 1.2 2.42.68.58 1.63.84 2.53.7.87-.13 1.66-.63 2.12-1.38.45-.75.55-1.7.46-2.56-.07-1.07-.52-2.15-1.2-2.91-.71-.78-1.76-1.14-2.73-1.11v-4.04c.01 0 .01 0 0 0z" />
    </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);


export default function HomePage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
    { href: "#contacto", label: "Contacto" },
  ];

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
    {
      slug: "gastronomia",
      title: "Gastronomía",
      description: "Fusiona arte y técnica culinaria para crear experiencias únicas.",
      image: "/images/carousel/chef-cooking.jpg",
      imageHint: "chef cooking",
    },
    {
      slug: "hoteleria-y-turismo",
      title: "Hotelería y Turismo",
      description:
        "Gestiona servicios de hospitalidad con estándares internacionales.",
      image: "/images/carousel/luxury-hotel.jpg",
      imageHint: "luxury hotel",
    },
    {
      slug: "derecho",
      title: "Derecho",
      description:
        "Forma profesionales con sólidos principios éticos y jurídicos.",
      image: "/images/carousel/law-books-courtroom.jpg",
      imageHint: "law books courtroom",
    },
    {
      slug: "psicologia",
      title: "Psicología",
      description:
        "Comprende el comportamiento humano para promover el bienestar.",
      image: "/images/carousel/therapy-session.jpg",
      imageHint: "therapy session",
    },
    {
      slug: "enfermeria",
      title: "Enfermería",
      description:
        "Cuidado integral de la salud con vocación de servicio y humanismo.",
      image: "/images/carousel/nurses-hospital.jpg",
      imageHint: "nurses hospital",
    },
    {
      slug: "comunicacion-social",
      title: "Comunicación Social",
      description:
        "Forma comunicadores estratégicos para medios y organizaciones.",
      image: "/images/carousel/media-broadcast.jpg",
      imageHint: "media broadcast",
    },
  ];

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = (api: CarouselApi) => {
      setCurrentSlide(api.selectedScrollSnap());
    };
    
    const onSettle = (api: CarouselApi) => {
      if (!api.plugins().autoplay.isPlaying()) {
        api.plugins().autoplay.play();
      }
    }

    carouselApi.on("select", onSelect);
    carouselApi.on("settle", onSettle);

    return () => {
      carouselApi.off("select", onSelect);
       carouselApi.off("settle", onSettle);
    };
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
    if (carouselApi && !carouselApi.plugins().autoplay.isPlaying()) {
      carouselApi.plugins().autoplay.play();
    }
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
          className="relative flex h-screen w-full items-center justify-center text-center text-white"
        >
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 z-10 bg-[#002147]/60" />
          </div>
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
            <Carousel 
                setApi={setCarouselApi} 
                className="w-full"
                plugins={[autoplayPlugin.current]}
                opts={{
                    loop: true,
                    align: "start",
                }}
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.play}
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
                        <div className="w-full max-w-2xl rounded-lg bg-black/50 p-8 text-center text-white backdrop-blur-sm">
                          <h3 className="font-poppins text-4xl font-bold">
                            {program.title}
                          </h3>
                          <p className="mt-4 text-lg">
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
