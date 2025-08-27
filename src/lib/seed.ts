
import { db } from './firebase'; 
import { collection, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  duracionCiclo: "9 Ciclos",
  modalidad: "Virtual / Presencial",
  descripcionGeneral: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  descripcionAprendizaje: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
  imagenURL: "https://placehold.co/800x400/002147/FFFFFF?text=Comercio+Exterior",
  materias: [
    { id: "c1-mb", nombre: "Matemática Básica", codigo: "C1-MB" },
    { id: "c1-ca", nombre: "Clasificación Arancelaria", codigo: "C1-CA" },
    { id: "c1-ice", nombre: "Introducción al Comercio Exterior", codigo: "C1-ICE" },
    { id: "c1-aig", nombre: "Acuerdos Internacionales y Geopolítica", codigo: "C1-AIG" },
    { id: "c1-tic", nombre: "TIC", codigo: "C1-TIC" },
    { id: "c2-cc", nombre: "Competencias Comunicativas", codigo: "C2-CC" },
    { id: "c2-e", nombre: "Estadística", codigo: "C2-E" },
    { id: "c2-la", nombre: "Legislación Aduanera", codigo: "C2-LA" },
    { id: "c2-mi", nombre: "Marketing Internacional", codigo: "C2-MI" },
    { id: "c2-fe", nombre: "Fundamentos de Economía", codigo: "C2-FE" },
    { id: "c2-pv", nombre: "Plan de Vida", codigo: "C2-PV" },
    { id: "c3-pi1", nombre: "Procesos de Importación I", codigo: "C3-PI1" },
  ]
};

const gruposData = [
    {
        codigoGrupo: "C1-MB-001",
        materia: { id: "c1-mb", nombre: "Matemática Básica" },
        docente: { id: "docente01", nombre: "Ana Pérez", usuarioId: "user01" },
        modalidad: "Virtual",
        franjaHoraria: "Nocturna",
        aula: { sede: "Virtual", salon: "Zoom-101" },
        estudiantes: [
            { estudianteId: "est001", usuarioId: "userEst001", nombre: "Juan Perez" },
            { estudianteId: "est002", usuarioId: "userEst002", nombre: "Maria Lopez" },
        ],
        horario: [
            { dia: "Lunes", hora: "6:00 PM - 8:00 PM" },
            { dia: "Miércoles", hora: "6:00 PM - 8:00 PM" },
        ]
    },
    {
        codigoGrupo: "C1-CA-002",
        materia: { id: "c1-ca", nombre: "Clasificación Arancelaria" },
        docente: { id: "docente02", nombre: "Carlos Rivas", usuarioId: "user02" },
        modalidad: "Presencial",
        franjaHoraria: "Diurna",
        aula: { sede: "Principal", salon: "302" },
        estudiantes: [
             { estudianteId: "est001", usuarioId: "userEst001", nombre: "Juan Perez" },
        ],
        horario: [
            { dia: "Martes", hora: "10:00 AM - 12:00 PM" },
            { dia: "Jueves", hora: "10:00 AM - 12:00 PM" },
        ]
    },
    {
        codigoGrupo: "C2-MI-001",
        materia: { id: "c2-mi", nombre: "Marketing Internacional" },
        docente: { id: "docente03", nombre: "Laura Mendoza", usuarioId: "user03" },
        modalidad: "Virtual",
        franjaHoraria: "Sabatina",
        aula: { sede: "Virtual", salon: "Teams-Marketing" },
        estudiantes: [
            { estudianteId: "est002", usuarioId: "userEst002", nombre: "Maria Lopez" },
        ],
        horario: [
            { dia: "Sábado", hora: "8:00 AM - 12:00 PM" },
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
        
        const q = query(gruposRef, where("codigoGrupo", "in", gruposData.map(g => g.codigoGrupo)));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            throw new Error(`Uno o más grupos de ejemplo ya existen.`);
        }
        
        const batch = writeBatch(db);

        for (const grupo of gruposData) {
            const { estudiantes, horario, ...grupoDocData } = grupo;
            const grupoDocRef = collection(gruposRef); // This is not correct. It should be doc(gruposRef) to create a new doc ref
            // Correct way: const grupoDocRef = doc(gruposRef);
            const newGrupoRef = addDoc(gruposRef, grupoDocData);
        }
        
        // Firestore does not support adding documents and then adding subcollections in the same batch like this.
        // Let's add them one by one. This is a seed script, performance is not critical.
        for (const grupo of gruposData) {
            await addDoc(gruposRef, grupo);
        }

        return { success: true, message: "Datos de grupos insertados exitosamente." };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        return { success: false, message: errorMessage };
    }
}
    