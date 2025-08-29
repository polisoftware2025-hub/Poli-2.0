
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, GraduationCap, Menu, Phone, Mail, MapPin, DollarSign, Clock,Award } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { carreraData } from "@/lib/seed"; 
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";


// En una aplicación real, estos datos vendrían de una API o CMS.
// Por ahora, usamos los datos de ejemplo del seed y datos simulados.
const programData: { [key: string]: any } = {
  "tecnologia-en-comercio-exterior-y-negocios-internacionales": {
    ...carreraData,
    inversion: 2800000,
    titulo: "Tecnólogo en Comercio Exterior y Negocios Internacionales"
  },
  "administracion-de-empresas": {
    nombre: "Administración de Empresas",
    slug: "administracion-de-empresas",
    descripcionGeneral: "Forma líderes con visión estratégica para la gestión eficiente y competitiva de organizaciones en un entorno globalizado.",
    perfilProfesional: "El Administrador de Empresas diseña, implementa y evalúa estrategias gerenciales en áreas como finanzas, marketing, talento humano y operaciones para asegurar el crecimiento y la sostenibilidad de la organización.",
    imagenURL: "/images/Administacion-de-Empresas.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Presencial / Virtual",
    inversion: 3200000,
    titulo: "Administrador de Empresas",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Fundamentos de Administración", creditos: 3 }, { nombre: "Matemáticas I", creditos: 3 }, { nombre: "Contabilidad General", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Procesos Administrativos", creditos: 3 }, { nombre: "Estadística Descriptiva", creditos: 3 }, { nombre: "Microeconomía", creditos: 2 }] }
    ]
  },
  "contaduria-publica": {
    nombre: "Contaduría Pública",
    slug: "contaduria-publica",
    descripcionGeneral: "Prepara expertos en el control financiero, la auditoría y la normativa contable para garantizar la transparencia y la salud financiera de las empresas.",
    perfilProfesional: "El Contador Público está capacitado para analizar estados financieros, gestionar tributos, realizar auditorías y asegurar el cumplimiento de las normativas contables y fiscales vigentes.",
    imagenURL: "/images/carousel/accounting-finance.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Presencial",
    inversion: 3000000,
    titulo: "Contador Público",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Contabilidad Financiera I", creditos: 3 }, { nombre: "Legislación Comercial", creditos: 2 }, { nombre: "Cálculo Diferencial", creditos: 3 }] },
      { numero: 2, materias: [{ nombre: "Contabilidad de Costos", creditos: 3 }, { nombre: "Tributaria I", creditos: 3 }, { nombre: "Macroeconomía", creditos: 2 }] }
    ]
  },
  "mercadeo-y-publicidad": {
    nombre: "Mercadeo y Publicidad",
    slug: "mercadeo-y-publicidad",
    descripcionGeneral: "Desarrolla estrategias creativas e innovadoras para posicionar marcas, productos y servicios en mercados competitivos, utilizando herramientas digitales y tradicionales.",
    perfilProfesional: "El profesional en Mercadeo y Publicidad crea y gestiona campañas, investiga mercados, analiza el comportamiento del consumidor y desarrolla estrategias de comunicación 360°.",
    imagenURL: "/images/carousel/marketing-team.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Virtual",
    inversion: 3100000,
    titulo: "Profesional en Mercadeo y Publicidad",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Fundamentos de Mercadeo", creditos: 3 }, { nombre: "Teoría de la Comunicación", creditos: 2 }, { nombre: "Diseño Básico", creditos: 3 }] },
      { numero: 2, materias: [{ nombre: "Investigación de Mercados", creditos: 3 }, { nombre: "Marketing Digital I", creditos: 3 }, { nombre: "Redacción Publicitaria", creditos: 2 }] }
    ]
  },
  "ingenieria-de-sistemas": {
    nombre: "Ingeniería de Sistemas",
    slug: "ingenieria-de-sistemas",
    descripcionGeneral: "Crea soluciones tecnológicas, de software y de infraestructura para optimizar procesos, gestionar información y resolver problemas complejos en las organizaciones.",
    perfilProfesional: "El Ingeniero de Sistemas diseña, desarrolla e implementa software, gestiona redes y bases de datos, y lidera proyectos tecnológicos innovadores.",
    imagenURL: "/images/carousel/software-development.jpg",
    duracionCiclo: "9 Ciclos",
    modalidad: "Presencial / Virtual",
    inversion: 3500000,
    titulo: "Ingeniero de Sistemas",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Algoritmos y Programación", creditos: 3 }, { nombre: "Cálculo I", creditos: 3 }, { nombre: "Lógica de Programación", creditos: 3 }] },
      { numero: 2, materias: [{ nombre: "Estructuras de Datos", creditos: 3 }, { nombre: "Bases de Datos I", creditos: 3 }, { nombre: "Sistemas Operativos", creditos: 3 }] }
    ]
  },
  "gastronomia": {
    nombre: "Gastronomía",
    slug: "gastronomia",
    descripcionGeneral: "Fusiona arte, técnica y ciencia culinaria para crear experiencias gastronómicas únicas, gestionando cocinas y negocios de alimentos y bebidas.",
    perfilProfesional: "El Gastrónomo domina técnicas culinarias nacionales e internacionales, crea menús, gestiona costos y administra restaurantes y eventos con altos estándares de calidad.",
    imagenURL: "/images/carousel/chef-cooking.jpg",
    duracionCiclo: "6 Ciclos",
    modalidad: "Presencial",
    inversion: 4000000,
    titulo: "Gastrónomo Profesional",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Técnicas Básicas de Cocina", creditos: 4 }, { nombre: "Higiene y Manipulación de Alimentos", creditos: 2 }, { nombre: "Historia de la Gastronomía", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Cocina Colombiana", creditos: 4 }, { nombre: "Panadería y Pastelería Básica", creditos: 3 }, { nombre: "Costos de Alimentos y Bebidas", creditos: 2 }] }
    ]
  },
  "hoteleria-y-turismo": {
    nombre: "Hotelería y Turismo",
    slug: "hoteleria-y-turismo",
    descripcionGeneral: "Gestiona servicios de hospitalidad, alojamiento y agencias de viajes, creando experiencias turísticas memorables con estándares de calidad internacionales.",
    perfilProfesional: "El profesional en Hotelería y Turismo administra hoteles, organiza eventos, diseña productos turísticos y promueve destinos de manera sostenible.",
    imagenURL: "/images/carousel/luxury-hotel.jpg",
    duracionCiclo: "7 Ciclos",
    modalidad: "Presencial",
    inversion: 2900000,
    titulo: "Profesional en Hotelería y Turismo",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Introducción al Turismo", creditos: 2 }, { nombre: "Gestión de Alojamiento", creditos: 3 }, { nombre: "Geografía Turística", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Servicio al Cliente", creditos: 2 }, { nombre: "Agencias de Viajes y Tour Operadores", creditos: 3 }, { nombre: "Patrimonio Cultural", creditos: 3 }] }
    ]
  },
  "derecho": {
    nombre: "Derecho",
    slug: "derecho",
    descripcionGeneral: "Forma profesionales con sólidos principios éticos y un profundo conocimiento jurídico para asesorar, representar y defender los derechos de personas y empresas.",
    perfilProfesional: "El Abogado interpreta y aplica el ordenamiento jurídico en diversas áreas como el derecho civil, penal, laboral y administrativo, actuando con justicia y equidad.",
    imagenURL: "/images/carousel/law-books-courtroom.jpg",
    duracionCiclo: "10 Ciclos",
    modalidad: "Presencial",
    inversion: 3800000,
    titulo: "Abogado(a)",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Introducción al Derecho", creditos: 3 }, { nombre: "Derecho Romano", creditos: 2 }, { nombre: "Teoría del Estado", creditos: 3 }] },
      { numero: 2, materias: [{ nombre: "Derecho Civil Personas", creditos: 3 }, { nombre: "Derecho Constitucional", creditos: 3 }, { nombre: "Sociología Jurídica", creditos: 2 }] }
    ]
  },
  "psicologia": {
    nombre: "Psicología",
    slug: "psicologia",
    descripcionGeneral: "Comprende el comportamiento humano desde una perspectiva científica y humanista para evaluar, diagnosticar e intervenir en procesos psicológicos y promover el bienestar.",
    perfilProfesional: "El Psicólogo aplica sus conocimientos en áreas como la clínica, la educativa, la organizacional y la social, contribuyendo al desarrollo individual y colectivo.",
    imagenURL: "/images/carousel/therapy-session.jpg",
    duracionCiclo: "9 Ciclos",
    modalidad: "Presencial",
    inversion: 3600000,
    titulo: "Psicólogo(a)",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Historia de la Psicología", creditos: 2 }, { nombre: "Procesos Psicológicos Básicos", creditos: 3 }, { nombre: "Biología Humana", creditos: 3 }] },
      { numero: 2, materias: [{ nombre: "Psicología del Desarrollo", creditos: 3 }, { nombre: "Estadística Aplicada", creditos: 3 }, { nombre: "Teorías de la Personalidad", creditos: 3 }] }
    ]
  },
  "enfermeria": {
    nombre: "Enfermería",
    slug: "enfermeria",
    descripcionGeneral: "Forma profesionales para el cuidado integral de la salud del individuo, la familia y la comunidad, con vocación de servicio, ética y humanismo.",
    perfilProfesional: "El Enfermero(a) participa en la promoción, prevención, tratamiento y rehabilitación de la salud, trabajando en equipos interdisciplinarios en diversos entornos de atención.",
    imagenURL: "/images/carousel/nurses-hospital.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Presencial",
    inversion: 3700000,
    titulo: "Enfermero(a) Profesional",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Fundamentos de Enfermería", creditos: 4 }, { nombre: "Anatomía y Fisiología", creditos: 3 }, { nombre: "Bioquímica", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Cuidado Básico del Paciente", creditos: 4 }, { nombre: "Farmacología", creditos: 3 }, { nombre: "Microbiología", creditos: 2 }] }
    ]
  },
  "comunicacion-social": {
    nombre: "Comunicación Social",
    slug: "comunicacion-social",
    descripcionGeneral: "Forma comunicadores estratégicos capaces de crear, gestionar y difundir contenidos en medios masivos, digitales y organizaciones.",
    perfilProfesional: "El Comunicador Social se desempeña en periodismo, comunicación organizacional, producción audiovisual y gestión de redes sociales, con una visión crítica y creativa.",
    imagenURL: "/images/carousel/media-broadcast.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Virtual / Presencial",
    inversion: 3300000,
    titulo: "Comunicador Social y Periodista",
    ciclos: [
      { numero: 1, materias: [{ nombre: "Teorías de la Comunicación", creditos: 3 }, { nombre: "Redacción para Medios", creditos: 3 }, { nombre: "Fotografía Básica", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Periodismo Informativo", creditos: 3 }, { nombre: "Comunicación Organizacional", creditos: 3 }, { nombre: "Producción de Radio", creditos: 2 }] }
    ]
  }
};

const formatCurrency = (value: number) => {
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

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664 4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.552 0-3.868.014-5.225.076-2.805.127-4.223 1.543-4.35 4.35C2.368 9.944 2.356 10.26 2.356 12s.012 2.056.076 3.419c.127 2.805 1.543 4.223 4.35 4.35C8.132 19.828 8.448 19.84 12 19.84s3.868-.012 5.225-.076c2.805-.127 4.223-1.543 4.35-4.35.064-1.363.076-1.68.076-3.419s-.012-2.056-.076-3.419c-.127-2.805-1.543-4.223-4.35-4.35C15.868 3.98 15.552 3.965 12 3.965zM12 6.837c-2.848 0-5.163 2.315-5.163 5.163s2.315 5.163 5.163 5.163 5.163-2.315 5.163-5.163-2.315-5.163-5.163-5.163zm0 8.529c-1.87 0-3.366-1.496-3.366-3.366s1.496-3.366 3.366 3.366 3.366 1.496 3.366 3.366-1.496 3.366-3.366 3.366zm5.338-8.201c-.966 0-1.75.784-1.75 1.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75-.784-1.75-1.75-1.75z" />
    </svg>
);


export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const program = programData[slug] || Object.values(programData).find(p => p.slug === slug);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#inscripcion", label: "Inscripción" },
    { href: "/programas", label: "Programas" },
    { href: "/#contacto", label: "Contacto" },
  ];

  if (!program) {
    notFound();
  }

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
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Inversión por ciclo:</span>
                  </div>
                  <span className="text-gray-800 font-bold">{formatCurrency(program.inversion)}</span>
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

    