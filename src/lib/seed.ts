
import { db } from './firebase'; 
import { collection, addDoc, getDocs, query, where, writeBatch, doc, setDoc } from 'firebase/firestore';
import bcryptjs from "bcryptjs";

const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
};


export const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  slug: "tecnologia-en-comercio-exterior-y-negocios-internacionales",
  duracionCiclo: "9 Ciclos",
  modalidad: "Virtual / Presencial",
  descripcionGeneral: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  perfilProfesional: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
  imagenURL: "https://placehold.co/800x400/002147/FFFFFF?text=Comercio+Exterior",
  titulo: "Tecnólogo en Comercio Exterior y Negocios Internacionales",
  precioPorCiclo: {
    "1": 2800000, "2": 2850000, "3": 2900000, "4": 2950000, "5": 3000000,
    "6": 3050000, "7": 3100000, "8": 3150000, "9": 3200000
  },
  idSedes: ["sede-norte", "sede-80"], // Carreras pueden estar en múltiples sedes
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
    // ... (otros ciclos se mantienen igual)
  ]
};

const gruposData = [
    {
        codigoGrupo: "C1-MB-001",
        idCarrera: "tecnologia-en-comercio-exterior-y-negocios-internacionales",
        idSede: "sede-norte",
        ciclo: 1,
        materia: { id: "c1-mb", nombre: "Matemática Básica" },
        docente: { id: "docente01", nombre: "Ana Pérez", usuarioId: "user01", email: "docente@example.com" },
        modalidad: "Virtual",
        franjaHoraria: "Nocturna",
        estudiantes: [
            { id: "est001", nombre: "Juan Perez" },
            { id: "est002", nombre: "Maria Lopez" },
        ],
        horario: [ // Horario ahora se guarda aquí
            { dia: "Lunes", hora: "18:00 - 20:00", salonId: "norte-101", materia: "Matemática Básica", docente: "Ana Pérez" },
            { dia: "Miércoles", hora: "18:00 - 20:00", salonId: "norte-101", materia: "Matemática Básica", docente: "Ana Pérez" },
        ]
    },
    {
        codigoGrupo: "C1-CA-002",
        idCarrera: "tecnologia-en-comercio-exterior-y-negocios-internacionales",
        idSede: "sede-73",
        ciclo: 1,
        materia: { id: "c1-ca", nombre: "Clasificación Arancelaria" },
        docente: { id: "docente02", nombre: "Carlos Rivas", usuarioId: "user02", email: "carlos.rivas@example.com" },
        modalidad: "Presencial",
        franjaHoraria: "Diurna",
        estudiantes: [
             { id: "est001", nombre: "Juan Perez" },
        ],
        horario: [
            { dia: "Martes", hora: "10:00 - 12:00", salonId: "73-302", materia: "Clasificación Arancelaria", docente: "Carlos Rivas" },
            { dia: "Jueves", hora: "10:00 - 12:00", salonId: "73-302", materia: "Clasificación Arancelaria", docente: "Carlos Rivas" },
        ]
    },
];

export async function seedCarrera() {
  try {
    const carrerasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
    
    // Usamos el slug como ID del documento para evitar duplicados fácilmente
    const carreraDocRef = doc(carrerasRef, carreraData.slug);
    
    await setDoc(carreraDocRef, carreraData);
    return { success: true, message: "Datos de carrera insertados/actualizados exitosamente." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, message: errorMessage };
  }
}

export async function seedGrupos() {
    try {
        const batch = writeBatch(db);
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");

        for (const grupo of gruposData) {
            const q = query(gruposRef, where("codigoGrupo", "==", grupo.codigoGrupo));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                 const newGroupRef = doc(gruposRef);
                 batch.set(newGroupRef, grupo);
            } else {
                 console.log(`El grupo ${grupo.codigoGrupo} ya existe. Omitiendo.`);
            }
        }
        
        await batch.commit();

        return { success: true, message: "Datos de grupos insertados/verificados exitosamente." };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        console.error("Error en seedGrupos:", error);
        return { success: false, message: errorMessage };
    }
}

export async function seedInitialUsers() {
  const saltRounds = 10;
  const testUsers = [
    {
      id: "admin01",
      nombre1: "Admin",
      apellido1: "User",
      correoInstitucional: "admin@example.com",
      rol: { id: "admin", descripcion: "Administrador" },
      contrasena: "Admin123.",
    },
    {
      id: "gestor01",
      nombre1: "Gestor",
      apellido1: "User",
      correoInstitucional: "gestor@example.com",
      rol: { id: "gestor", descripcion: "Gestor" },
      contrasena: "Gestor123.",
    },
    {
      id: "docente01",
      nombre1: "Docente",
      apellido1: "User",
      correoInstitucional: "docente@example.com",
      rol: { id: "docente", descripcion: "Docente" },
      contrasena: "Docente123.",
    },
    {
      id: "est001",
      nombre1: "Estudiante",
      apellido1: "User",
      correoInstitucional: "estudiante@example.com",
      rol: { id: "estudiante", descripcion: "Estudiante" },
      contrasena: "Estudiante123.",
    },
  ];

  try {
    const batch = writeBatch(db);
    const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");

    const existingUsersSnapshot = await getDocs(usersRef);
    const existingEmails = new Set(
      existingUsersSnapshot.docs.map((doc) => doc.data().correoInstitucional)
    );

    for (const userData of testUsers) {
      if (!existingEmails.has(userData.correoInstitucional)) {
        const hashedPassword = await bcryptjs.hash(userData.contrasena, saltRounds);

        const userDocRef = doc(usersRef, userData.id);
        const finalUserData: any = {
          nombreCompleto: `${userData.nombre1} ${userData.apellido1}`,
          nombre1: userData.nombre1,
          apellido1: userData.apellido1,
          identificacion: `ID-${userData.id}`,
          correoInstitucional: userData.correoInstitucional,
          rol: userData.rol,
          contrasena: hashedPassword,
          estado: "activo",
          fechaRegistro: new Date(),
        };
        batch.set(userDocRef, finalUserData);

        if (userData.rol.id === 'estudiante') {
            const studentDocRef = doc(studentsRef, userData.id);
            const assignedSubjects = carreraData.ciclos[0].materias.map(m => ({ id: m.id, nombre: m.nombre, creditos: m.creditos }));
            batch.set(studentDocRef, {
                usuarioId: userData.id,
                nombreCompleto: finalUserData.nombreCompleto,
                documento: finalUserData.identificacion,
                carreraId: createSlug(carreraData.nombre),
                modalidad: "Virtual",
                grupo: "G-001",
                correoInstitucional: userData.correoInstitucional,
                cicloActual: 1,
                materiasInscritas: assignedSubjects,
                estaInscrito: true,
                estado: "aprobado",
                fechaRegistro: new Date()
            });
        }

      } else {
        console.log(
          `El usuario ${userData.correoInstitucional} ya existe. Omitiendo.`
        );
      }
    }

    await batch.commit();
    return {
      success: true,
      message: "Usuarios de prueba creados o verificados exitosamente.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    console.error("Error en seedInitialUsers:", error);
    return { success: false, message: errorMessage };
  }
}

export async function seedSedesYSalones() {
    const sedes = [
        { id: "sede-norte", nombre: "Sede Norte", direccion: "Avenida Siempre Viva 123" },
        { id: "sede-73", nombre: "Sede Calle 73", direccion: "Calle 73 #10-20" },
        { id: "sede-80", nombre: "Sede Calle 80", direccion: "Avenida Calle 80 #50-10" }
    ];

    const salonesPorSede: { [key: string]: { id: string, nombre: string, capacidad: number }[] } = {
        "sede-norte": [
            { id: "norte-101", nombre: "Salón 101", capacidad: 30 },
            { id: "norte-102", nombre: "Salón 102", capacidad: 25 },
            { id: "norte-auditorio", nombre: "Auditorio Principal", capacidad: 150 },
        ],
        "sede-73": [
            { id: "73-301", nombre: "Salón 301", capacidad: 40 },
            { id: "73-302", nombre: "Salón 302", capacidad: 40 },
            { id: "73-lab-sistemas", nombre: "Laboratorio de Sistemas", capacidad: 20 },
        ],
        "sede-80": [
            { id: "80-201", nombre: "Salón 201", capacidad: 35 },
            { id: "80-202", nombre: "Salón 202", capacidad: 35 },
            { id: "80-lab-gastronomia", nombre: "Cocina de Prácticas", capacidad: 15 },
        ]
    };

    try {
        const batch = writeBatch(db);
        const sedesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes");

        const existingSedesSnapshot = await getDocs(sedesRef);
        if (existingSedesSnapshot.docs.length > 0) {
             return { success: false, message: "Las sedes y salones ya parecen existir. No se realizó ninguna acción para evitar duplicados." };
        }
        
        for (const sede of sedes) {
            const sedeDocRef = doc(sedesRef, sede.id);
            batch.set(sedeDocRef, { nombre: sede.nombre, direccion: sede.direccion });

            const salonesRef = collection(sedeDocRef, "salones");
            const salones = salonesPorSede[sede.id];
            if (salones) {
                for (const salon of salones) {
                    const salonDocRef = doc(salonesRef, salon.id);
                    batch.set(salonDocRef, { nombre: salon.nombre, capacidad: salon.capacidad });
                }
            }
        }
        
        await batch.commit();
        return { success: true, message: "Sedes y salones de prueba creados exitosamente." };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        console.error("Error en seedSedesYSalones:", error);
        return { success: false, message: errorMessage };
    }
}
