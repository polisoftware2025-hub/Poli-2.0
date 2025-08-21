
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
import { GraduationCap, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';


export default function HomePage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#inscripcion", label: "Inscripción" },
    { href: "#programas", label: "Programas" },
    { href: "#contacto", label: "Contacto" },
  ];

  const programs = [
    {
      title: "Administración de Empresas",
      description:
        "Forma líderes con visión estratégica para gestionar organizaciones.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "business students",
    },
    {
      title: "Contaduría Pública",
      description:
        "Prepara expertos en el control financiero y la normativa contable.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "accounting finance",
    },
    {
      title: "Mercadeo y Publicidad",
      description:
        "Desarrolla estrategias creativas para posicionar marcas y productos.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "marketing team",
    },
    {
      title: "Ingeniería de Sistemas",
      description:
        "Crea soluciones tecnológicas innovadoras para optimizar procesos.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "software development",
    },
    {
      title: "Gastronomía",
      description: "Fusiona arte y técnica culinaria para crear experiencias únicas.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "chef cooking",
    },
    {
      title: "Hotelería y Turismo",
      description:
        "Gestiona servicios de hospitalidad con estándares internacionales.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "luxury hotel",
    },
    {
      title: "Derecho",
      description:
        "Forma profesionales con sólidos principios éticos y jurídicos.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "law books courtroom",
    },
    {
      title: "Psicología",
      description:
        "Comprende el comportamiento humano para promover el bienestar.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "therapy session",
    },
    {
      title: "Enfermería",
      description:
        "Cuidado integral de la salud con vocación de servicio y humanismo.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "nurses hospital",
    },
    {
      title: "Comunicación Social",
      description:
        "Forma comunicadores estratégicos para medios y organizaciones.",
      image: "https://placehold.co/1200x600.png",
      imageHint: "media broadcast",
    },
  ];

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
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
  };


  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="#inicio" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#002147]" />
            <span className="font-poppins text-xl font-bold text-[#002147]">
              Poli Intl.
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
             <Button asChild variant="outline" className="rounded-full border-[#004aad] text-[#004aad] transition-transform hover:scale-105 hover:bg-[#004aad] hover:text-white">
                <Link href="/register">Regístrate</Link>
            </Button>
          </nav>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="bg-white md:hidden">
            <nav className="flex flex-col items-center space-y-4 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-poppins text-base font-medium text-gray-700 transition-colors hover:text-[#004aad]"
                >
                  {link.label}
                </Link>
              ))}
               <Button asChild variant="outline" className="rounded-full border-[#004aad] text-[#004aad] transition-transform hover:scale-105 hover:bg-[#004aad] hover:text-white">
                    <Link href="/register">Regístrate</Link>
                </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section
          id="inicio"
          className="relative flex h-screen w-full items-center justify-center text-center text-white"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-background.jpg"
              alt="Estudiantes en campus universitario"
              fill
              style={{objectFit: 'cover'}}
              className="z-[-1]"
              data-ai-hint="university students campus"
            />
             <div className="absolute inset-0 z-10 bg-[#002147]/60" />
          </div>
          <div className="relative z-20 flex flex-col items-center p-6">
            <h1 className="font-poppins text-5xl font-bold md:text-7xl">
              Somos Politécnico Internacional
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
              <Button
                style={{ backgroundColor: "#2ecc71" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600"
              >
                Conoce Nuestros Programas
              </Button>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section id="inscripcion" className="bg-white py-20">
          <div className="container mx-auto max-w-4xl px-6" data-aos="fade-up">
            <Card className="rounded-xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
              <CardContent className="p-0">
                <p className="text-center font-poppins text-xl text-gray-700">
                  El Politécnico Internacional forma profesionales con calidad
                  y compromiso, preparados para los retos del mundo actual.
                </p>
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
            <Carousel setApi={setCarouselApi} className="w-full">
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
                            <Button
                              style={{ backgroundColor: "#004aad" }}
                              className="px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
                            >
                              Inscribirme
                            </Button>
                            <Button
                              className="px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 bg-[#2ecc71] hover:bg-[#27ae60] active:bg-[#219150]"
                            >
                              Ver más
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


        {/* CTA Section */}
        <section
          id="contacto"
          style={{ backgroundColor: "#002147" }}
          className="py-20"
        >
          <div className="container mx-auto px-6 text-center text-white" data-aos="fade-up">
            <h3 className="font-poppins text-3xl font-bold">
              ¿Quieres más información? Escríbenos.
            </h3>
            <Button
              asChild
              style={{ backgroundColor: "#004aad" }}
              className="mt-6 rounded-full px-10 py-5 text-base font-semibold text-white transition-transform hover:scale-105"
            >
              <a href="mailto:info@politecnicointernacional.edu">Contacto</a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

    