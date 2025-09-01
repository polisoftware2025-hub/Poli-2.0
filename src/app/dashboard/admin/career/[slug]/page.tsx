
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, User, CheckCircle, GraduationCap, DollarSign, Clock, Award, Plus, Trash2, Edit, Upload } from "lucide-react";
import { useParams, notFound } from "next/navigation";
import { carreraData } from "@/lib/seed"; 
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

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


export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const program = programData[slug];

  if (!program) {
    notFound();
  }

  return (
    <form className="flex flex-col gap-8">
      <PageHeader
        title={program.nombre}
        description="Modifica los detalles de este programa académico."
        icon={<Edit className="h-8 w-8 text-primary" />}
      />

      <Card className="overflow-hidden">
        <div className="relative h-64 w-full">
          <Image
            src={program.imagenURL}
            alt={`Imagen de ${program.nombre}`}
            fill
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
             <Button variant="secondary">
                <Upload className="mr-2 h-4 w-4"/>
                Cambiar Imagen
            </Button>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
            <div>
                <Label htmlFor="programName">Nombre de la Carrera</Label>
                <Input id="programName" defaultValue={program.nombre}/>
            </div>
            <div>
                <Label htmlFor="programDescription">Descripción General</Label>
                <Textarea id="programDescription" defaultValue={program.descripcionGeneral} rows={5}/>
            </div>
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
            <Textarea defaultValue={program.perfilProfesional} rows={8}/>
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
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="investment">Inversión por ciclo</Label>
                    <Input id="investment" type="number" defaultValue={program.inversion} />
                </div>
                 <div>
                    <Label htmlFor="duration">Duración (Ciclos)</Label>
                    <Input id="duration" defaultValue={program.duracionCiclo.split(" ")[0]}/>
                </div>
            </div>
             <div>
                <Label htmlFor="degreeTitle">Título Otorgado</Label>
                <Input id="degreeTitle" defaultValue={program.titulo} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <span>Créditos Totales:</span>
              </div>
              <span className="text-gray-800 font-bold">
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
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="ciclo-1">
            {program.ciclos.map((ciclo: any) => (
              <AccordionItem value={`ciclo-${ciclo.numero}`} key={ciclo.numero}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Ciclo {ciclo.numero}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pt-2">
                    {ciclo.materias.map((materia: any) => (
                      <li key={materia.codigo || materia.nombre} className="flex justify-between items-center text-gray-700 p-2 rounded-md hover:bg-gray-100">
                        <div className="flex-grow">
                            <span>{materia.nombre}</span>
                            <span className="text-sm font-medium text-white bg-primary px-2 py-1 rounded-full ml-2">{materia.creditos} créditos</span>
                        </div>
                        <div className="flex gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Editar Materia</DialogTitle>
                                        <DialogDescription>Modifica los datos de la materia.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label htmlFor="editSubjectName">Nombre de la Materia</Label>
                                            <Input id="editSubjectName" defaultValue={materia.nombre}/>
                                        </div>
                                        <div>
                                            <Label htmlFor="editSubjectCode">Código</Label>
                                            <Input id="editSubjectCode" defaultValue={materia.codigo || "N/A"}/>
                                        </div>
                                        <div>
                                            <Label htmlFor="editSubjectCredits">Créditos</Label>
                                            <Input id="editSubjectCredits" type="number" defaultValue={materia.creditos}/>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline">Cancelar</Button>
                                        <Button>Guardar Cambios</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4">
                            <Plus className="mr-2 h-4 w-4"/>
                            Agregar Materia
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Nueva Materia al Ciclo {ciclo.numero}</DialogTitle>
                            <DialogDescription>Completa los datos de la nueva materia.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                             <div>
                                <Label htmlFor="subjectName">Nombre de la Materia</Label>
                                <Input id="subjectName" placeholder="Ej: Cálculo Integral"/>
                            </div>
                             <div>
                                <Label htmlFor="subjectCode">Código</Label>
                                <Input id="subjectCode" placeholder="Ej: MAT-102"/>
                            </div>
                             <div>
                                <Label htmlFor="subjectCredits">Créditos</Label>
                                <Input id="subjectCredits" type="number" placeholder="Ej: 3"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline">Cancelar</Button>
                            <Button>Guardar Materia</Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
           <Button variant="secondary" className="mt-6">
                <Plus className="mr-2 h-4 w-4"/>
                Agregar Nuevo Ciclo
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-end gap-4">
             <Button type="button" variant="outline">Cancelar</Button>
             <Button type="submit">Guardar Cambios</Button>
        </CardFooter>
      </Card>

    </form>
  );
}

    