
"use client";

import { PageHeader } from "@/components/page-header";
import { User, Phone, BookOpen, Check, X, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Datos de ejemplo para la maquetación
const applicantData = {
  id: "pre_1",
  fullName: "Laura Sofía Gómez Pérez",
  email: "laura.gomez@email.com",
  phone: "310-123-4567",
  address: "Calle Falsa 123, Apto 404, Bogotá",
  idType: "Cédula de Ciudadanía",
  idNumber: "1.012.345.678",
  birthDate: "1998-05-20",
  program: "Ingeniería de Sistemas",
  cycle: "1",
  requestDate: "2024-08-15",
  status: "Pendiente",
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground sm:mt-0">{value}</dd>
  </div>
);

export default function PreRegisterDetailPage() {

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Detalle del Aspirante"
        description={`Revisa la información de ${applicantData.fullName}.`}
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">{applicantData.fullName}</CardTitle>
                    <CardDescription>Solicitud recibida el {new Date(applicantData.requestDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                </div>
                <Button>Descargar Documentos</Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Sección de Información Personal */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <User className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Información Personal</h3>
            </div>
            <dl className="space-y-4">
              <DetailItem label="Tipo de Identificación" value={applicantData.idType} />
              <DetailItem label="Número de Identificación" value={applicantData.idNumber} />
              <DetailItem label="Fecha de Nacimiento" value={new Date(applicantData.birthDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} />
            </dl>
          </section>

          <Separator />

          {/* Sección de Datos de Contacto */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Phone className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Datos de Contacto</h3>
            </div>
            <dl className="space-y-4">
              <DetailItem label="Correo Personal" value={applicantData.email} />
              <DetailItem label="Teléfono" value={applicantData.phone} />
              <DetailItem label="Dirección" value={applicantData.address} />
            </dl>
          </section>

          <Separator />

          {/* Sección de Información Académica */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Información Académica</h3>
            </div>
            <dl className="space-y-4">
              <DetailItem label="Carrera de Interés" value={applicantData.program} />
              <DetailItem label="Ciclo de Ingreso" value={applicantData.cycle} />
            </dl>
          </section>
        </CardContent>

        <CardFooter className="p-6 bg-gray-50 rounded-b-xl border-t">
          <div className="flex w-full justify-end gap-4">
            <Button variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Rechazar Solicitud
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" />
              Aprobar Solicitud
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
