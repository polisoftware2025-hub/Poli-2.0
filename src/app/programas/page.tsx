"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, GraduationCap, Menu, Phone, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163m0 1.802c-3.552 0-3.868.014-5.225.076-2.805.127-4.223 1.543-4.35 4.35C2.368 9.944 2.356 10.26 2.356 12s.012 2.056.076 3.419c.127 2.805 1.543 4.223 4.35 4.35C8.132 19.828 8.448 19.84 12 19.84s3.868-.012 5.225-.076c2.805-.127 4.223-1.543 4.35-4.35.064-1.363.076-1.68.076-3.419s-.012-2.056-.076-3.419c-.127-2.805-1.543-4.223-4.35-4.35C15.868 3.98 15.552 3.965 12 3.965zM12 6.837c-2.848 0-5.163 2.315-5.163 5.163s2.315 5.163 5.163 5.163 5.163-2.315 5.163-5.163-2.315-5.163-5.163-5.163zm0 8.529c-1.87 0-3.366-1.496-3.366-3.366s1.496-3.366 3.366 3.366 3.366 1.496 3.366 3.366-1.496 3.366-3.366 3.366zm5.338-8.201c-.966 0-1.75.784-1.75 1.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75-.784-1.75-1.75-1.75z" />
    </svg>
);

export default function ProgramsListPage() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
    { href: "/#contacto", label: "Contacto" },
  ];

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
                            <a href="#" className="group" aria-label="Instagram">
                               <InstagramIcon className="h-7 w-7 text-white transition-colors group-hover:text-[#E1306C]" />
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
