import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch, doc, getDoc, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// --- Data Interfaces ---
interface Materia { id: string; nombre: string; horasSemanales: number; }
interface Docente { id: string; nombreCompleto: string; materiasAptas?: string[]; disponibilidad?: any; }
interface Salon { id: string; nombre: string; capacidad: number; }
interface Grupo { id: string; codigoGrupo: string; capacidad: number; horario: any[]; }
interface Clase { materiaId: string; materiaNombre: string; duracion: number; grupo: Grupo; }
interface ScheduleEntry {
  id: string; dia: string; hora: string; duracion: number; materiaId: string; materiaNombre: string;
  docenteId: string; docenteNombre: string; modalidad: "Presencial" | "Virtual";
  sedeId?: string; sedeNombre?: string; salonId?: string; salonNombre?: string;
  fechaInicio?: Timestamp;
  fechaFin?: Timestamp;
}

// --- Main Handler ---
export async function POST(req: NextRequest) {
    try {
        const { sedeId, carreraId, ciclo, grupoId: selectedGrupoId, docentesIds, periodo, horarioLote } = await req.json();

        if (!sedeId || !carreraId || !ciclo) {
            return NextResponse.json({ message: "Sede, carrera y ciclo son requeridos." }, { status: 400 });
        }
        
        // 1. Fetch all necessary data
        const [allGrupos, materias, allDocentes, salones] = await Promise.all([
            fetchGrupos(sedeId, carreraId, ciclo),
            fetchMaterias(carreraId, ciclo),
            fetchDocentes(),
            fetchSalones(sedeId),
        ]);

        const gruposToSchedule = selectedGrupoId === 'all'
            ? allGrupos
            : allGrupos.filter(g => g.id === selectedGrupoId);

        const docentesToUse = docentesIds && docentesIds.length > 0
            ? allDocentes.filter(d => docentesIds.includes(d.id))
            : allDocentes;
        
        if (gruposToSchedule.length === 0) {
            return NextResponse.json({ message: "No se encontraron grupos para los parámetros seleccionados." }, { status: 404 });
        }

        // 2. Solve the schedule
        const newSchedules = solve(gruposToSchedule, materias, docentesToUse, salones, periodo, horarioLote);

        if (Object.keys(newSchedules).length === 0) {
             return NextResponse.json({ message: "No se pudo generar un horario sin conflictos con los recursos disponibles." }, { status: 409 });
        }

        // 3. Commit to Firestore
        const batch = writeBatch(db);
        for (const grupoId in newSchedules) {
            const grupoRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", grupoId);
            batch.update(grupoRef, { horario: newSchedules[grupoId] });
        }
        await batch.commit();

        return NextResponse.json({ message: `Horario generado exitosamente para ${Object.keys(newSchedules).length} grupo(s).` }, { status: 200 });

    } catch (error) {
        console.error("[SCHEDULE AUTOGENERATE ERROR]", error);
        const message = error instanceof Error ? error.message : "Error interno del servidor.";
        return NextResponse.json({ message }, { status: 500 });
    }
}


// --- Data Fetching Functions ---
async function fetchGrupos(sedeId: string, carreraId: string, ciclo: number): Promise<Grupo[]> {
    const q = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos"),
        where("idSede", "==", sedeId),
        where("idCarrera", "==", carreraId),
        where("ciclo", "==", ciclo)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grupo));
}

async function fetchMaterias(carreraId: string, cicloNum: number): Promise<Materia[]> {
    const careerRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", carreraId);
    const careerSnap = await getDoc(careerRef);
    if (!careerSnap.exists()) throw new Error("Carrera no encontrada.");
    const ciclo = careerSnap.data().ciclos?.find((c: any) => c.numero === cicloNum);
    if (!ciclo) throw new Error("Ciclo no encontrado en la carrera.");
    return ciclo.materias;
}

async function fetchDocentes(): Promise<Docente[]> {
    const q = query(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), where("rol.id", "==", "docente"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Docente));
}

async function fetchSalones(sedeId: string): Promise<Salon[]> {
    const salonesRef = collection(db, `Politecnico/mzIX7rzezDezczAV6pQ7/sedes/${sedeId}/salones`);
    const snapshot = await getDocs(salonesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salon));
}

// --- Algorithm Core ---

const timeSlots = ["18:00", "20:00"]; // Simplified
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function solve(
    grupos: Grupo[], 
    materias: Materia[], 
    docentes: Docente[], 
    salones: Salon[],
    periodo?: { from?: string, to?: string },
    horarioLote?: { dia: string, horaInicio: string, horaFin: string }
): Record<string, ScheduleEntry[]> {
    let clases: Clase[] = [];
    for (const grupo of grupos) {
        for (const materia of materias) {
            let horasRestantes = materia.horasSemanales;
            while (horasRestantes > 0) {
                clases.push({ materiaId: materia.id, materiaNombre: materia.nombre, duracion: 2, grupo });
                horasRestantes -= 2;
            }
        }
    }

    let ocupacionDocentes: Record<string, Set<string>> = {};
    let ocupacionSalones: Record<string, Set<string>> = {};
    let ocupacionGrupos: Record<string, Set<string>> = {};

    let horarioFinal: ScheduleEntry[] = [];
    
    function backtrack(claseIndex: number): boolean {
        if (claseIndex >= clases.length) {
            return true; // Solución encontrada
        }

        const clase = clases[claseIndex];
        
        const possibleDays = horarioLote?.dia ? [horarioLote.dia] : daysOfWeek;
        const possibleTimes = horarioLote?.horaInicio ? [horarioLote.horaInicio] : timeSlots;

        for (const docente of docentes) {
            for (const dia of possibleDays) {
                for (const hora of possibleTimes) {
                    for (const salon of salones) {
                        if (isAssignmentValid(clase, docente, salon, dia, hora, ocupacionDocentes, ocupacionSalones, ocupacionGrupos)) {
                            // --- Asignar ---
                            const timeKey = `${dia}-${hora}`;
                            const startTime = parseInt(hora.split(':')[0]);
                            const endTime = startTime + clase.duracion;

                            const entry: ScheduleEntry = {
                                id: crypto.randomUUID(),
                                dia, hora: `${hora} - ${endTime.toString().padStart(2, '0')}:00`, duracion: clase.duracion,
                                materiaId: clase.materiaId, materiaNombre: clase.materiaNombre,
                                docenteId: docente.id, docenteNombre: docente.nombreCompleto,
                                modalidad: "Presencial", salonId: salon.id, salonNombre: salon.nombre
                            };
                            if (periodo?.from) entry.fechaInicio = Timestamp.fromDate(new Date(periodo.from));
                            if (periodo?.to) entry.fechaFin = Timestamp.fromDate(new Date(periodo.to));
                            
                            horarioFinal.push(entry);

                            if (!ocupacionDocentes[docente.id]) ocupacionDocentes[docente.id] = new Set();
                            if (!ocupacionSalones[salon.id]) ocupacionSalones[salon.id] = new Set();
                            if (!ocupacionGrupos[clase.grupo.id]) ocupacionGrupos[clase.grupo.id] = new Set();
                            
                            ocupacionDocentes[docente.id].add(timeKey);
                            ocupacionSalones[salon.id].add(timeKey);
                            ocupacionGrupos[clase.grupo.id].add(timeKey);

                            // --- Recursión ---
                            if (backtrack(claseIndex + 1)) {
                                return true;
                            }

                            // --- Backtrack (deshacer) ---
                            horarioFinal.pop();
                            ocupacionDocentes[docente.id].delete(timeKey);
                            ocupacionSalones[salon.id].delete(timeKey);
                            ocupacionGrupos[clase.grupo.id].delete(timeKey);
                        }
                    }
                }
            }
        }
        return false; // No se encontró solución para esta clase
    }

    if (backtrack(0)) {
        // Agrupar por grupo
        const scheduleByGroup: Record<string, ScheduleEntry[]> = {};
        horarioFinal.forEach(entry => {
            const grupoId = clases.find(c => c.materiaId === entry.materiaId)!.grupo.id;
            if (!scheduleByGroup[grupoId]) {
                scheduleByGroup[grupoId] = [];
            }
            scheduleByGroup[grupoId].push(entry);
        });
        return scheduleByGroup;
    }

    return {}; // No se encontró solución
}


function isAssignmentValid(
    clase: Clase,
    docente: Docente,
    salon: Salon,
    dia: string,
    hora: string,
    ocupacionDocentes: Record<string, Set<string>>,
    ocupacionSalones: Record<string, Set<string>>,
    ocupacionGrupos: Record<string, Set<string>>
): boolean {
    const timeKey = `${dia}-${hora}`;

    // 1. Conflicto de Grupo
    if (ocupacionGrupos[clase.grupo.id]?.has(timeKey)) return false;

    // 2. Conflicto de Docente
    if (ocupacionDocentes[docente.id]?.has(timeKey)) return false;

    // 3. Conflicto de Salón
    if (ocupacionSalones[salon.id]?.has(timeKey)) return false;

    // 4. Aptitud de Docente
    if (!docente.materiasAptas?.includes(clase.materiaId)) {
        // This is a soft constraint for now, but should ideally be hard.
    }
    
    // 5. Disponibilidad del Docente
    const disponibilidadDocente = docente.disponibilidad;
    if (disponibilidadDocente && disponibilidadDocente.dias && Array.isArray(disponibilidadDocente.dias) && disponibilidadDocente.dias.length > 0) {
        if (!disponibilidadDocente.dias.includes(dia)) return false;
        
        const franja = disponibilidadDocente.franjas?.[dia];
        if (franja && franja.inicio && franja.fin) {
            const horaInicioClase = parseInt(hora.split(':')[0]);
            const horaFinClase = horaInicioClase + clase.duracion;
            const horaInicioDisponibilidad = parseInt(franja.inicio.split(':')[0]);
            const horaFinDisponibilidad = parseInt(franja.fin.split(':')[0]);

            if (horaInicioClase < horaInicioDisponibilidad || horaFinClase > horaFinDisponibilidad) {
                return false;
            }
        }
    }

    return true;
}
    