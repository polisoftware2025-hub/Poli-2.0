
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { carreraData } from "@/lib/seed"; 
import Image from "next/image";

// En una aplicación real, estos datos vendrían de una API o CMS.
// Por ahora, usamos los datos de ejemplo del seed y datos simulados.
const programData: { [key: string]: any } = {
  "tecnologia-en-comercio-exterior-y-negocios-internacionales": carreraData,
  "administracion-de-empresas": {
    nombre: "Administración de Empresas",
    slug: "administracion-de-empresas",
    descripcionGeneral: "Forma líderes con visión estratégica para la gestión eficiente y competitiva de organizaciones en un entorno globalizado.",
    perfilProfesional: "El Administrador de Empresas diseña, implementa y evalúa estrategias gerenciales en áreas como finanzas, marketing, talento humano y operaciones para asegurar el crecimiento y la sostenibilidad de la organización.",
    imagenURL: "/images/Administacion-de-Empresas.jpg",
    duracionCiclo: "8 Ciclos",
    modalidad: "Presencial / Virtual",
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
    ciclos: [
      { numero: 1, materias: [{ nombre: "Teorías de la Comunicación", creditos: 3 }, { nombre: "Redacción para Medios", creditos: 3 }, { nombre: "Fotografía Básica", creditos: 2 }] },
      { numero: 2, materias: [{ nombre: "Periodismo Informativo", creditos: 3 }, { nombre: "Comunicación Organizacional", creditos: 3 }, { nombre: "Producción de Radio", creditos: 2 }] }
    ]
  }
};

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const program = programData[slug] || Object.values(programData).find(p => p.slug === slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container mx-auto px-4 py-8">
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
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Duración:</span>
                  <span className="text-gray-600">{program.duracionCiclo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Modalidad:</span>
                  <span className="text-gray-600">{program.modalidad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Créditos Totales:</span>
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
              <CardTitle>Plan de Estudios</CardTitle>
              <CardDescription>Explora las materias que verás en cada ciclo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {program.ciclos.map((ciclo: any) => (
                  <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                    <AccordionTrigger className="text-lg font-semibold">Ciclo {ciclo.numero}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 list-disc pl-5">
                        {ciclo.materias.map((materia: any) => (
                          <li key={materia.codigo || materia.nombre} className="text-gray-700">
                            {materia.nombre} <span className="text-sm text-gray-500">({materia.creditos} créditos)</span>
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
    </div>
  );
}
