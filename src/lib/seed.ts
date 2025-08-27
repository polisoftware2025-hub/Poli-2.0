
import { db } from './firebase'; 
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  duracionCiclo: "9 Ciclos",
  modalidad: "Virtual / Presencial",
  descripcionGeneral: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  descripcionAprendizaje: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
  imagenURL: "https://placehold.co/800x400/002147/FFFFFF?text=Comercio+Exterior",
  ciclos: [
    {
      numero: 1,
      materias: [
        { id: "c1-mb", nombre: "Matemática Básica", codigo: "C1-MB", creditos: 2 },
        { id: "c1-ca", nombre: "Clasificación Arancelaria", codigo: "C1-CA", creditos: 2 },
        { id: "c1-ice", nombre: "Introducción al Comercio Exterior", codigo: "C1-ICE", creditos: 2 },
        { id: "c1-aig", nombre: "Acuerdos Internacionales y Geopolítica", codigo: "C1-AIG", creditos: 2 },
        { id: "c1-tic", nombre: "TIC", codigo: "C1-TIC", creditos: 2 }
      ]
    },
    {
      numero: 2,
      materias: [
        { id: "c2-cc", nombre: "Competencias Comunicativas", codigo: "C2-CC", creditos: 2 },
        { id: "c2-e", nombre: "Estadística", codigo: "C2-E", creditos: 2 },
        { id: "c2-la", nombre: "Legislación Aduanera", codigo: "C2-LA", creditos: 2 },
        { id: "c2-mi", nombre: "Marketing Internacional", codigo: "C2-MI", creditos: 2 },
        { id: "c2-fe", nombre: "Fundamentos de Economía", codigo: "C2-FE", creditos: 2 },
        { id: "c2-pv", nombre: "Plan de Vida", codigo: "C2-PV", creditos: 0 }
      ]
    },
    {
        numero: 3,
        materias: [
            { id: "c3-pi1", nombre: "Procesos de Importación I", codigo: "C3-PI1", creditos: 2 },
            { id: "c3-pe1", nombre: "Procesos de Exportación I", codigo: "C3-PE1", creditos: 2 },
            { id: "c3-mpcc", nombre: "Medios de Pago y Coberturas Cambiarias", codigo: "C3-MPCC", creditos: 2 },
            { id: "c3-ci", nombre: "Cambios Internacionales", codigo: "C3-CI", creditos: 2 },
            { id: "c3-i1", nombre: "Inglés I", codigo: "C3-I1", creditos: 2 }
        ]
    }
    // ... más ciclos
  ]
};

const gruposData = [
    {
        codigoGrupo: "C1-MB-001",
        materia: { id: "c1-mb", nombre: "Matemática Básica" },
        docente: { id: "docente01", nombre: "Ana Pérez", usuarioId: "user01", email: "docente@example.com" },
        modalidad: "Virtual",
        franjaHoraria: "Nocturna",
        aula: { sede: "Sede Norte", salon: "Zoom-101" },
        estudiantes: [
            { id: "est001", nombre: "Juan Perez" },
            { id: "est002", nombre: "Maria Lopez" },
        ],
        horario: [
            { dia: "Lunes", hora: "18:00 - 20:00" },
            { dia: "Miércoles", hora: "18:00 - 20:00" },
        ]
    },
    {
        codigoGrupo: "C1-CA-002",
        materia: { id: "c1-ca", nombre: "Clasificación Arancelaria" },
        docente: { id: "docente02", nombre: "Carlos Rivas", usuarioId: "user02", email: "carlos.rivas@example.com" },
        modalidad: "Presencial",
        franjaHoraria: "Diurna",
        aula: { sede: "Sede 73", salon: "302" },
        estudiantes: [
             { id: "est001", nombre: "Juan Perez" },
        ],
        horario: [
            { dia: "Martes", hora: "10:00 - 12:00" },
            { dia: "Jueves", hora: "10:00 - 12:00" },
        ]
    },
    {
        codigoGrupo: "C2-MI-001",
        materia: { id: "c2-mi", nombre: "Marketing Internacional" },
        docente: { id: "docente01", nombre: "Ana Pérez", usuarioId: "user01", email: "docente@example.com" },
        modalidad: "Virtual",
        franjaHoraria: "Sabatina",
        aula: { sede: "Sede 80", salon: "Teams-Marketing" },
        estudiantes: [
            { id: "est002", nombre: "Maria Lopez" },
        ],
        horario: [
            { dia: "Sábado", hora: "08:00 - 12:00" },
        ]
    }
];

export async function seedCarrera() {
  try {
    const carrerasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
    
    const q = query(carrerasRef, where("nombre", "==", carreraData.nombre));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error("La carrera 'Tecnología en Comercio Exterior y Negocios Internacionales' ya existe.");
    }
    
    await addDoc(carrerasRef, carreraData);
    return { success: true, message: "Datos de carrera insertados exitosamente." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, message: errorMessage };
  }
}

export async function seedGrupos() {
    try {
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        const codigosExistentes = new Set();
        
        for (const grupo of gruposData) {
            const q = query(gruposRef, where("codigoGrupo", "==", grupo.codigoGrupo));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                codigosExistentes.add(grupo.codigoGrupo);
            }
        }

        if (codigosExistentes.size > 0) {
            const codigosStr = Array.from(codigosExistentes).join(", ");
            throw new Error(`Los siguientes grupos ya existen: ${codigosStr}`);
        }
        
        for (const grupo of gruposData) {
            await addDoc(gruposRef, grupo);
        }

        return { success: true, message: "Datos de grupos insertados exitosamente." };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        console.error("Error en seedGrupos:", error);
        return { success: false, message: errorMessage };
    }
}
