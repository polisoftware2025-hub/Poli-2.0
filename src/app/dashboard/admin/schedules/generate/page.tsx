
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Wand2, Building, BookCopy, Users, Info, Clock, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface Sede { id: string; nombre: string; }
interface Career { id: string; nombre: string; ciclos: { numero: number; materias: { id: string; nombre: string }[] }[]; }
interface Docente { id: string; nombreCompleto: string; disponibilidad?: any; }

const AvailabilityTooltip = ({ docente }: { docente: Docente }) => {
    if (!docente.disponibilidad) {
        return <p>Este docente no ha configurado su disponibilidad.</p>;
    }
    return (
        <div className="text-left">
            <p className="font-bold mb-2">Disponibilidad</p>
            <p><span className="font-semibold">Modalidad:</span> {docente.disponibilidad.modalidad || 'N/A'}</p>
            <ul className="list-disc pl-4 mt-2">
                {(docente.disponibilidad.dias || []).map((dia: string) => (
                    <li key={dia}>
                        {dia}: {docente.disponibilidad.franjas?.[dia]?.inicio || 'N/A'} - {docente.disponibilidad.franjas?.[dia]?.fin || 'N/A'}
                    </li>
                ))}
            </ul>
        </div>
    );
};


export default function GenerateSchedulePage() {
    const { toast } = useToast();
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Multi-step form state
    const [activeStep, setActiveStep] = useState(0);
    const [selectedSede, setSelectedSede] = useState("");
    const [selectedCarrera, setSelectedCarrera] = useState("");
    const [selectedCiclo, setSelectedCiclo] = useState("");
    const [selectedDocentes, setSelectedDocentes] = useState<string[]>([]);
    const [subjectConfig, setSubjectConfig] = useState<any>({});
    const [conflictingGroups, setConflictingGroups] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const sedesSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes"));
                setSedes(sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sede)));

                const carrerasSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
                setCarreras(carrerasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Career)));

                const docentesQuery = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), where("rol.id", "==", "docente"));
                const docentesSnapshot = await getDocs(docentesQuery);
                setDocentes(docentesSnapshot.docs.map(doc => ({ id: doc.id, nombreCompleto: doc.data().nombreCompleto, disponibilidad: doc.data().disponibilidad } as Docente)));
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
            }
        };
        fetchInitialData();
    }, [toast]);
    
    // Effect to check for existing schedules when parameters change
    useEffect(() => {
        if (!selectedSede || !selectedCarrera || !selectedCiclo) {
            setConflictingGroups([]);
            return;
        }

        const checkForConflicts = async () => {
            try {
                const q = query(
                    collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
                    where("idSede", "==", selectedSede),
                    where("idCarrera", "==", selectedCarrera),
                    where("ciclo", "==", parseInt(selectedCiclo))
                );
                const querySnapshot = await getDocs(q);
                const conflicts = querySnapshot.docs
                    .filter(doc => doc.data().horario && doc.data().horario.length > 0)
                    .map(doc => doc.data().codigoGrupo);
                setConflictingGroups(conflicts);
            } catch (error) {
                console.error("Error checking for schedule conflicts:", error);
            }
        };

        checkForConflicts();
    }, [selectedSede, selectedCarrera, selectedCiclo]);

    const ciclosDisponibles = useMemo(() => {
        const carrera = carreras.find(c => c.id === selectedCarrera);
        return carrera?.ciclos.map(c => c.numero) || [];
    }, [selectedCarrera, carreras]);
    
    const materiasDelCiclo = useMemo(() => {
        if (!selectedCarrera || !selectedCiclo) return [];
        const carrera = carreras.find(c => c.id === selectedCarrera);
        const ciclo = carrera?.ciclos.find(c => c.numero === parseInt(selectedCiclo));
        return ciclo?.materias || [];
    }, [selectedCarrera, selectedCiclo, carreras]);
    
    const handleGenerate = async () => {
        if (!selectedSede || !selectedCarrera || !selectedCiclo) {
            toast({ variant: "destructive", title: "Campos requeridos", description: "Debes seleccionar sede, carrera y ciclo." });
            return;
        }
        setIsGenerating(true);
        
        try {
            const response = await fetch('/api/admin/schedules/autogenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sedeId: selectedSede, carreraId: selectedCarrera, ciclo: parseInt(selectedCiclo) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast({ title: "Éxito", description: data.message });
            setActiveStep(0);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error en la Generación", description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSubjectConfigChange = (materiaId: string, field: string, value: any) => {
        setSubjectConfig((prev: any) => ({
            ...prev,
            [materiaId]: {
                ...(prev[materiaId] || {}),
                [field]: value,
            }
        }));
    };

    const nextStep = () => setActiveStep((prev) => prev + 1);
    const prevStep = () => setActiveStep((prev) => prev - 1);
    const stepsCount = 3;

    return (
        <div className="flex flex-col gap-8 h-full">
            <PageHeader
                title="Asistente de Generación de Horarios"
                description="Configura las reglas y preferencias para generar un nuevo horario automáticamente."
                icon={<Wand2 className="h-8 w-8 text-primary" />}
                backPath="/dashboard/admin/schedules"
            />
             <div className="flex-grow flex flex-col min-h-0">
                <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
                    <StepperItem index={0} title="Parámetros">
                        <div className="py-4 space-y-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <Label>Sede</Label>
                                <Select onValueChange={setSelectedSede} value={selectedSede}><SelectTrigger><SelectValue placeholder="Selecciona una sede..." /></SelectTrigger><SelectContent>{sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Carrera</Label>
                                <Select onValueChange={v => { setSelectedCarrera(v); setSelectedCiclo(""); }} value={selectedCarrera}><SelectTrigger><SelectValue placeholder="Selecciona una carrera..." /></SelectTrigger><SelectContent>{carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ciclo</Label>
                                <Select onValueChange={setSelectedCiclo} value={selectedCiclo} disabled={!selectedCarrera}><SelectTrigger><SelectValue placeholder="Selecciona un ciclo..." /></SelectTrigger><SelectContent>{ciclosDisponibles.map(c => <SelectItem key={c} value={String(c)}>Ciclo {c}</SelectItem>)}</SelectContent></Select>
                            </div>
                            {conflictingGroups.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>¡Atención! Horarios Existentes Detectados</AlertTitle>
                                    <AlertDescription>
                                        Los siguientes grupos ya tienen un horario asignado. Continuar sobrescribirá sus horarios actuales:
                                        <ul className="list-disc pl-5 mt-2">
                                            {conflictingGroups.map(group => <li key={group}>{group}</li>)}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </StepperItem>
                    <StepperItem index={1} title="Docentes">
                        <div className="py-4 space-y-4 max-w-2xl mx-auto">
                            <Label className="text-center block">Selecciona los docentes a considerar para este horario</Label>
                            <ScrollArea className="h-96 w-full rounded-md border p-4">
                            <TooltipProvider>
                            {docentes.map(docente => (
                                <div key={docente.id} className="flex items-center space-x-2 mb-2">
                                    <Checkbox 
                                        id={docente.id}
                                        checked={selectedDocentes.includes(docente.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? setSelectedDocentes(prev => [...prev, docente.id])
                                                : setSelectedDocentes(prev => prev.filter(id => id !== docente.id))
                                        }}
                                    />
                                    <label htmlFor={docente.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {docente.nombreCompleto}
                                    </label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Info className="h-4 w-4 text-muted-foreground"/></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <AvailabilityTooltip docente={docente} />
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            ))}
                            </TooltipProvider>
                            </ScrollArea>
                        </div>
                    </StepperItem>
                    <StepperItem index={2} title="Materias">
                        <div className="py-4 space-y-4">
                            <Label className="text-center block">Configura cada materia (opcional). Lo que no definas, el sistema lo asignará automáticamente.</Label>
                            <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader><TableRow><TableHead>Materia</TableHead><TableHead>Modalidad</TableHead><TableHead>Docente (Opcional)</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {materiasDelCiclo.map(materia => (
                                        <TableRow key={materia.id}>
                                            <TableCell className="font-medium">{materia.nombre}</TableCell>
                                            <TableCell>
                                                <Select onValueChange={(val) => handleSubjectConfigChange(materia.id, 'modalidad', val)}><SelectTrigger><SelectValue placeholder="Auto"/></SelectTrigger><SelectContent><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Virtual">Virtual</SelectItem></SelectContent></Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select onValueChange={(val) => handleSubjectConfigChange(materia.id, 'docenteId', val)}><SelectTrigger><SelectValue placeholder="Automático"/></SelectTrigger><SelectContent>{docentes.filter(d => selectedDocentes.includes(d.id)).map(d => <SelectItem key={d.id} value={d.id}>{d.nombreCompleto}</SelectItem>)}</SelectContent></Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    </StepperItem>
                </Stepper>
            </div>
             <div className="p-6 border-t mt-auto bg-card">
                 <div className="flex justify-between w-full">
                    <Button variant="outline" onClick={prevStep} disabled={activeStep === 0}>
                        Anterior
                    </Button>
                    {activeStep === stepsCount - 1 ? (
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? "Generando..." : "Generar Horario"}
                        </Button>
                    ) : (
                        <Button onClick={nextStep}>Siguiente</Button>
                    )}
                </div>
            </div>
        </div>
    );
}

    