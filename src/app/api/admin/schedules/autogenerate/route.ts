
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// --- Data Interfaces ---
interface Materia { id: string; nombre: string; horasSemanales: number; }
interface Docente { id: string; nombreCompleto: string; materiasAptas?: string[]; disponibilidad?: any; }
interface Salon { id: string; nombre: string; capacidad: number; }
interface Grupo { id: string; codigoGrupo: string; capacidad: number; horario: any[]; }
interface ScheduleEntry {
  id: string; dia: string; hora: string; duracion: number; materiaId: string; materiaNombre: string;
  docenteId: string; docenteNombre: string; modalidad: "Presencial" | "Virtual";
  sedeId?: string; sedeNombre?: string; salonId?: string; salonNombre?: string;
}

// --- Main Handler ---
export async function POST(req: NextRequest) {
    try {
        const { sedeId, carreraId, ciclo } = await req.json();

        if (!sedeId || !carreraId || !ciclo) {
            return NextResponse.json({ message: "Sede, carrera y ciclo son requeridos." }, { status: 400 });
        }
        
        // 1. Fetch all necessary data
        const [grupos, materias, docentes, salones] = await Promise.all([
            fetchGrupos(sedeId, carreraId, ciclo),
            fetchMaterias(carreraId, ciclo),
            fetchDocentes(),
            fetchSalones(sedeId),
        ]);
        
        if (grupos.length === 0) {
            return NextResponse.json({ message: "No se encontraron grupos para los parámetros seleccionados." }, { status: 404 });
        }

        // 2. Solve the schedule
        const newSchedules = solve(grupos, materias, docentes, salones);

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


// --- Algorithm ---
function solve(grupos: Grupo[], materias: Materia[], docentes: Docente[], salones: Salon[]): Record<string, ScheduleEntry[]> {
    const scheduleByGroup: Record<string, ScheduleEntry[]> = {};

    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const timeSlots = ["18:00", "20:00"]; // Simplified for now

    for (const grupo of grupos) {
        let currentSchedule: ScheduleEntry[] = [];
        let possible = true;

        for (const materia of materias) {
            let hoursLeft = materia.horasSemanales;
            const blockDuration = 2;

            while(hoursLeft > 0) {
                let assigned = false;
                for (const dia of daysOfWeek) {
                    for (const hora of timeSlots) {
                        for (const docente of docentes) {
                            for (const salon of salones) {
                                if (isAssignmentValid(materia, docente, salon, dia, hora, blockDuration, grupo, currentSchedule)) {
                                    const startTime = parseInt(hora.split(':')[0]);
                                    const endTime = startTime + blockDuration;
                                    
                                    currentSchedule.push({
                                        id: crypto.randomUUID(),
                                        dia,
                                        hora: `${hora} - ${endTime.toString().padStart(2, '0')}:00`,
                                        duracion: blockDuration,
                                        materiaId: materia.id,
                                        materiaNombre: materia.nombre,
                                        docenteId: docente.id,
                                        docenteNombre: docente.nombreCompleto,
                                        modalidad: "Presencial",
                                        salonId: salon.id,
                                        salonNombre: salon.nombre
                                    });
                                    assigned = true;
                                    break;
                                }
                            }
                            if (assigned) break;
                        }
                        if (assigned) break;
                    }
                    if (assigned) break;
                }
                
                if (!assigned) {
                    possible = false; // Couldn't assign this block
                    break;
                }
                hoursLeft -= blockDuration;
            }
            if (!possible) break;
        }

        if (possible) {
            scheduleByGroup[grupo.id] = currentSchedule;
        }
    }
    return scheduleByGroup;
}


function isAssignmentValid(
    materia: Materia,
    docente: Docente,
    salon: Salon,
    dia: string,
    hora: string,
    duracion: number,
    grupo: Grupo,
    currentSchedule: ScheduleEntry[]
): boolean {
    const startTime = parseInt(hora.split(':')[0]);
    const endTime = startTime + duracion;

    // 1. Docente availability (simplified)
    if (!docente.materiasAptas?.includes(materia.id)) return false;

    // 2. Conflict check within the current group's schedule
    for (const entry of currentSchedule) {
        if (entry.dia !== dia) continue;
        const [entryStart, entryEnd] = entry.hora.split(' - ').map(t => parseInt(t.split(':')[0]));
        if (Math.max(startTime, entryStart) < Math.min(endTime, entryEnd)) return false; // Overlap
    }
    
    // In a full implementation, you would also check against a global schedule for docentes and salones.
    // This is a simplified version for now.

    return true;
}

