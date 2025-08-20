
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [isMenuOpen, setMenuOpen] = useState(false);

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
      image: "https://placehold.co/600x400.png",
      imageHint: "business management",
    },
    {
      title: "Contaduría Pública",
      description:
        "Prepara expertos en el control financiero y la normativa contable.",
      image: "https://placehold.co/600x400.png",
      imageHint: "public accounting",
    },
    {
      title: "Mercadeo y Publicidad",
      description:
        "Desarrolla estrategias creativas para posicionar marcas y productos.",
      image: "https://placehold.co/600x400.png",
      imageHint: "marketing advertising",
    },
    {
      title: "Ingeniería de Sistemas",
      description:
        "Crea soluciones tecnológicas innovadoras para optimizar procesos.",
      image: "https://placehold.co/600x400.png",
      imageHint: "systems engineering",
    },
    {
      title: "Gastronomía",
      description: "Fusiona arte y técnica culinaria para crear experiencias únicas.",
      image: "https://placehold.co/600x400.png",
      imageHint: "gastronomy cooking",
    },
    {
      title: "Hotelería y Turismo",
      description:
        "Gestiona servicios de hospitalidad con estándares internacionales.",
      image: "https://placehold.co/600x400.png",
      imageHint: "hotel tourism",
    },
    {
      title: "Derecho",
      description:
        "Forma profesionales con sólidos principios éticos y jurídicos.",
      image: "https://placehold.co/600x400.png",
      imageHint: "law justice",
    },
    {
      title: "Psicología",
      description:
        "Comprende el comportamiento humano para promover el bienestar.",
      image: "https://placehold.co/600x400.png",
      imageHint: "psychology wellness",
    },
    {
      title: "Enfermería",
      description:
        "Cuidado integral de la salud con vocación de servicio y humanismo.",
      image: "https://placehold.co/600x400.png",
      imageHint: "nursing healthcare",
    },
    {
      title: "Comunicación Social",
      description:
        "Forma comunicadores estratégicos para medios y organizaciones.",
      image: "https://placehold.co/600x400.png",
      imageHint: "social communication",
    },
  ];

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
              src="https://placehold.co/1920x1080.png"
              alt="Estudiantes en campus universitario"
              layout="fill"
              objectFit="cover"
              className="brightness-50"
              data-ai-hint="university students campus"
            />
          </div>
          <div className="relative z-10 flex flex-col items-center p-6">
            <h1 className="font-poppins text-5xl font-bold md:text-7xl">
              Somos Politécnico Internacional
            </h1>
            <p className="mt-4 text-lg md:text-xl">
              Tu futuro profesional comienza aquí.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                style={{ backgroundColor: "#004aad" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105"
              >
                Inicia Sesión
              </Button>
              <Button
                style={{ backgroundColor: "#2ecc71" }}
                className="rounded-full px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105"
              >
                Conoce Nuestros Programas
              </Button>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section id="inscripcion" className="bg-white py-20">
          <div className="container mx-auto max-w-4xl px-6">
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
          <div className="container mx-auto px-6">
            <h2 className="text-center font-poppins text-3xl font-bold text-gray-800">
              Nuestros Programas Académicos
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {programs.map((program, index) => (
                <Card
                  key={index}
                  className="flex flex-col md:flex-row overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className="md:w-1/3">
                    <Image
                      src={program.image}
                      alt={`Imagen de ${program.title}`}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover"
                      data-ai-hint={program.imageHint}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 md:w-2/3">
                    <CardHeader className="p-0">
                      <CardTitle className="font-poppins text-xl font-bold text-gray-800">
                        {program.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 pt-2">
                      <p className="text-gray-600">{program.description}</p>
                    </CardContent>
                    <CardFooter className="p-0 pt-4">
                      <Button
                        style={{ backgroundColor: "#004aad" }}
                        className="w-full rounded-md py-3 font-semibold text-white transition-opacity hover:opacity-90 md:w-auto md:px-6"
                      >
                        Ver más
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
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
          <div className="container mx-auto px-6 text-center text-white">
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

    