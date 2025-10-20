
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
interface SubjectPreferences { [key: string]: { modality: string; teacherId: string } }

// --- Main Handler ---
export async function POST(req: NextRequest) {
    try {
        const { sedeId, carreraId, ciclo, grupoId: selectedGrupoId, docentesIds, periodo, horarioLote, subjectPreferences } = await req.json();

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
        const newSchedules = solve(gruposToSchedule, materias, docentesToUse, salones, periodo, horarioLote, subjectPreferences);

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

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function generateTimeSlots(start: string, end: string): string[] {
    const slots = [];
    let currentHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    while (currentHour < endHour) {
        slots.push(`${currentHour.toString().padStart(2, '0')}:00`);
        currentHour++;
    }
    return slots;
}


function solve(
    grupos: Grupo[], 
    materias: Materia[], 
    docentes: Docente[], 
    salones: Salon[],
    periodo?: { from?: string, to?: string },
    horarioLote?: { dia: string, horaInicio: string, horaFin: string },
    subjectPreferences?: SubjectPreferences
): Record<string, ScheduleEntry[]> {
    let clases: Clase[] = [];
    for (const grupo of grupos) {
        for (const materia of materias) {
            let horasRestantes = materia.horasSemanales;
            while (horasRestantes > 0) {
                const duracionBloque = Math.min(horasRestantes, 2); // Split into 2-hour blocks
                clases.push({ materiaId: materia.id, materiaNombre: materia.nombre, duracion: duracionBloque, grupo });
                horasRestantes -= duracionBloque;
            }
        }
    }

    let ocupacionDocentes: Record<string, Set<string>> = {};
    let ocupacionSalones: Record<string, Set<string>> = {};
    let ocupacionGrupos: Record<string, Set<string>> = {};

    let scheduleByGroup: Record<string, ScheduleEntry[]> = {};
    for (const grupo of grupos) {
        scheduleByGroup[grupo.id] = [];
    }
    
    function backtrack(claseIndex: number): boolean {
        if (claseIndex >= clases.length) {
            return true; // Solution found
        }

        const clase = clases[claseIndex];
        const preference = subjectPreferences?.[clase.materiaId];

        const possibleDays = horarioLote?.dia ? [horarioLote.dia] : daysOfWeek;
        const timeSlots = horarioLote?.horaInicio && horarioLote.horaFin ? generateTimeSlots(horarioLote.horaInicio, horarioLote.horaFin) : generateTimeSlots("07:00", "22:00");
        
        const preferredTeacherId = preference?.teacherId && preference.teacherId !== 'any' ? preference.teacherId : null;
        
        let teacherPool = docentes;
        if (preferredTeacherId) {
            const preferredTeacher = docentes.find(d => d.id === preferredTeacherId);
            if (preferredTeacher) {
                // Prioritize preferred teacher
                teacherPool = [preferredTeacher, ...docentes.filter(d => d.id !== preferredTeacherId)];
            }
        }

        for (const docente of teacherPool) {
            for (const dia of possibleDays) {
                for (const hora of timeSlots) {
                    for (const salon of salones) {
                        if (isAssignmentValid(clase, docente, salon, dia, hora, ocupacionDocentes, ocupacionSalones, ocupacionGrupos)) {
                            
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
                            
                            if (!ocupacionDocentes[docente.id]) ocupacionDocentes[docente.id] = new Set();
                            if (!ocupacionSalones[salon.id]) ocupacionSalones[salon.id] = new Set();
                            if (!ocupacionGrupos[clase.grupo.id]) ocupacionGrupos[clase.grupo.id] = new Set();
                            
                            ocupacionDocentes[docente.id].add(timeKey);
                            ocupacionSalones[salon.id].add(timeKey);
                            ocupacionGrupos[clase.grupo.id].add(timeKey);
                            scheduleByGroup[clase.grupo.id].push(entry);

                            if (backtrack(claseIndex + 1)) {
                                return true;
                            }

                            scheduleByGroup[clase.grupo.id].pop();
                            ocupacionDocentes[docente.id].delete(timeKey);
                            ocupacionSalones[salon.id].delete(timeKey);
                            ocupacionGrupos[clase.grupo.id].delete(timeKey);
                        }
                    }
                }
            }
        }
        return false;
    }

    if (backtrack(0)) {
        return scheduleByGroup;
    }

    return {}; // No solution found
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

    // 1. Teacher's subject aptitude
    if (docente.materiasAptas && !docente.materiasAptas.includes(clase.materiaId)) {
       return false;
    }

    // 2. Group conflict
    if (ocupacionGrupos[clase.grupo.id]?.has(timeKey)) return false;

    // 3. Teacher conflict
    if (ocupacionDocentes[docente.id]?.has(timeKey)) return false;

    // 4. Room conflict
    if (ocupacionSalones[salon.id]?.has(timeKey)) return false;
    
    // 5. Teacher's availability
    const disponibilidadDocente = docente.disponibilidad;
    if (disponibilidadDocente && disponibilidadDocente.dias && Array.isArray(disponibilidadDocente.dias) && disponibilidadDocente.dias.length > 0) {
        if (!disponibilidadDocente.dias.includes(dia)) {
            return false;
        }
        
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
