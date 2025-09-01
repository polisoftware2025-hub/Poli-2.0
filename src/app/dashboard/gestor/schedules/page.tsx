"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Calendar, Building, School, Plus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";


const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const scheduleData = {
  "sede_norte": {
    "salon_101": [
      { dia: "Lunes", hora: "07:00", duracion: 2, materia: "Cálculo Diferencial", grupo: "CD-001", docente: "Ana Pérez" },
      { dia: "Miércoles", hora: "07:00", duracion: 2, materia: "Cálculo Diferencial", grupo: "CD-001", docente: "Ana Pérez" },
      { dia: "Martes", hora: "10:00", duracion: 3, materia: "Base de Datos", grupo: "BD-002", docente: "Carlos Rivas" },
      { dia: "Jueves", hora: "10:00", duracion: 3, materia: "Base de Datos", grupo: "BD-002", docente: "Carlos Rivas" },
    ],
    "salon_102": [
       { dia: "Viernes", hora: "09:00", duracion: 4, materia: "Inteligencia Artificial", grupo: "IA-001", docente: "Luisa Fernandez" },
    ]
  },
  "sede_73": {
    "salon_301": [
      { dia: "Sábado", hora: "08:00", duracion: 4, materia: "Marketing Digital", grupo: "MD-S01", docente: "Sofia Castro" }
    ],
    "salon_302": []
  }
}

export default function SchedulesManagerPage() {
  const [selectedSede, setSelectedSede] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("");

  const sedes = [
    { id: "sede_norte", nombre: "Sede Norte" },
    { id: "sede_73", nombre: "Sede Calle 73" },
    { id: "sede_80", nombre: "Sede Calle 80" },
  ];

  const salonesPorSede: { [key: string]: { id: string; nombre: string }[] } = {
    "sede_norte": [{ id: "salon_101", nombre: "Salón 101" }, { id: "salon_102", nombre: "Salón 102" }],
    "sede_73": [{ id: "salon_301", nombre: "Salón 301" }, { id: "salon_302", nombre: "Salón 302" }],
    "sede_80": [{ id: "salon_a", nombre: "Salón A" }, { id: "salon_b", nombre: "Salón B" }],
  };

  const scheduleForSalon = (selectedSede && selectedSalon ? scheduleData[selectedSede as keyof typeof scheduleData]?.[selectedSalon as keyof typeof scheduleData['sede_norte']] : []) || [];
  
  const scheduleGrid: (any | null)[][] = timeSlots.map(() => Array(daysOfWeek.length).fill(null));

  scheduleForSalon.forEach(entry => {
    const dayIndex = daysOfWeek.indexOf(entry.dia);
    const timeIndex = timeSlots.indexOf(entry.hora);

    if (dayIndex !== -1 && timeIndex !== -1) {
      scheduleGrid[timeIndex][dayIndex] = entry;
      for (let i = 1; i < entry.duracion; i++) {
        if (timeIndex + i < timeSlots.length) {
          scheduleGrid[timeIndex + i][dayIndex] = { ...entry, materia: 'SPAN' }; // Mark as spanned
        }
      }
    }
  });


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Horarios y Aulas"
        description="Visualiza, asigna y modifica la programación de clases en las diferentes sedes."
        icon={<Calendar className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtro de Horarios</CardTitle>
          <CardDescription>Selecciona una sede y un salón para ver y editar su horario semanal.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
                <label className="text-sm font-medium">Sede</label>
                <Select value={selectedSede} onValueChange={(value) => {
                    setSelectedSede(value);
                    setSelectedSalon("");
                }}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona una sede" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {sedes.map(sede => <SelectItem key={sede.id} value={sede.id}>{sede.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
           </div>
           <div className="space-y-2">
                <label className="text-sm font-medium">Salón</label>
                 <Select value={selectedSalon} onValueChange={setSelectedSalon} disabled={!selectedSede}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={selectedSede ? "Selecciona un salón" : "Elige una sede primero"} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {selectedSede && salonesPorSede[selectedSede].map(salon => <SelectItem key={salon.id} value={salon.id}>{salon.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
           </div>
        </CardContent>
      </Card>
      
      {selectedSede && selectedSalon ? (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <div>
                    <CardTitle>Horario para {salonesPorSede[selectedSede].find(s => s.id === selectedSalon)?.nombre}</CardTitle>
                    <CardDescription>Sede: {sedes.find(s => s.id === selectedSede)?.nombre}</CardDescription>
                </div>
                 <Button>
                    <Plus className="mr-2 h-4 w-4"/>
                    Asignar Clase
                </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
                {scheduleForSalon.length > 0 ? (
                    <div className="overflow-x-auto">
                    <Table className="min-w-full border">
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-24 border-r text-center font-bold">Hora</TableHead>
                            {daysOfWeek.map(day => (
                            <TableHead key={day} className="border-r text-center font-bold">{day}</TableHead>
                            ))}
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {timeSlots.map((time, timeIndex) => (
                            <TableRow key={time}>
                            <TableCell className="border-r text-center font-mono text-xs text-muted-foreground">{time}</TableCell>
                            {daysOfWeek.map((day, dayIndex) => {
                                const entry = scheduleGrid[timeIndex][dayIndex];
                                if (entry && entry.materia === 'SPAN') {
                                return null;
                                }
                                return (
                                <TableCell key={day} rowSpan={entry?.duracion || 1} className={`border-r p-1 align-top h-20 ${entry ? 'bg-primary/5 cursor-pointer hover:bg-primary/10' : 'hover:bg-gray-50 cursor-pointer'}`}>
                                    {entry && (
                                    <div className="bg-white p-2 rounded-md border-l-4 border-blue-500 shadow-sm h-full flex flex-col justify-center">
                                        <p className="font-bold text-xs text-blue-800">{entry.materia}</p>
                                        <p className="text-xs text-muted-foreground">{entry.grupo}</p>
                                        <p className="text-xs text-muted-foreground">{entry.docente}</p>
                                    </div>
                                    )}
                                </TableCell>
                                );
                            })}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                ) : (
                    <Alert>
                        <School className="h-4 w-4" />
                        <AlertTitle>Salón Disponible</AlertTitle>
                        <AlertDescription>
                            Este salón no tiene clases programadas. Puedes empezar a asignar clases usando el botón de arriba.
                        </AlertDescription>
                    </Alert>
                )}
                 <div className="flex justify-end mt-6">
                    <Button variant="secondary">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios en el Horario
                    </Button>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Selecciona una Sede y Salón</AlertTitle>
            <AlertDescription>
                Por favor, elige una sede y un salón para visualizar y gestionar el horario correspondiente.
            </AlertDescription>
        </Alert>
      )}

    </div>
  );
}
