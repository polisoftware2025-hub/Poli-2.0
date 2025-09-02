
import { db } from './firebase'; 
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import bcrypt from "bcrypt";

export const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  duracionCiclo: "9 Ciclos",
  modalidad: "Virtual / Presencial",
  descripcionGeneral: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  perfilProfesional: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
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
    },
    {
      numero: 4,
      materias: [
          { id: "c4-cp", nombre: "Costos y Presupuestos", codigo: "C4-CP", creditos: 2 },
          { id: "c4-pi2", nombre: "Procesos de Importación II", codigo: "C4-PI2", creditos: 2 },
          { id: "c4-pe2", nombre: "Procesos de Exportación II", codigo: "C4-PE2", creditos: 2 },
          { id: "c4-caa", nombre: "Cadena de Abastecimiento y Alistamiento", codigo: "C4-CAA", creditos: 2 },
          { id: "c4-i2", nombre: "Inglés II", codigo: "C4-I2", creditos: 2 }
      ]
    },
    {
      numero: 5,
      materias: [
          { id: "c5-pi3", nombre: "Procesos de Importación III", codigo: "C5-PI3", creditos: 2 },
          { id: "c5-pe3", nombre: "Procesos de Exportación III", codigo: "C5-PE3", creditos: 2 },
          { id: "c5-oe", nombre: "Orientación a la Empleabilidad", codigo: "C5-OE", creditos: 2 },
          { id: "c5-i3", nombre: "Inglés III", codigo: "C5-I3", creditos: 4 }
      ]
    },
    {
      numero: 6,
      materias: [
          { id: "c6-pc", nombre: "Participación Ciudadana", codigo: "C6-PC", creditos: 1 },
          { id: "c6-cis", nombre: "Comercialización Internacional de Servicios", codigo: "C6-CIS", creditos: 2 },
          { id: "c6-zf", nombre: "Zonas Francas", codigo: "C6-ZF", creditos: 1 },
          { id: "c6-dfi", nombre: "Distribución Física Internacional", codigo: "C6-DFI", creditos: 2 },
          { id: "c6-oae", nombre: "Orientación al Emprendimiento", codigo: "C6-OAE", creditos: 1 },
          { id: "c6-p1", nombre: "Proyectos I", codigo: "C6-P1", creditos: 1 },
          { id: "c6-i4", nombre: "Inglés IV", codigo: "C6-I4", creditos: 2 }
      ]
    },
    {
      numero: 7,
      materias: [
          { id: "c7-ed1", nombre: "Electiva Disciplinar I", codigo: "C7-ED1", creditos: 2 },
          { id: "c7-nci", nombre: "Negociaciones y Contratos Internacionales", codigo: "C7-NCI", creditos: 2 },
          { id: "c7-tt", nombre: "Tráfico y Transporte", codigo: "C7-TT", creditos: 1 },
          { id: "c7-e1", nombre: "Empleabilidad I", codigo: "C7-E1", creditos: 1 },
          { id: "c7-em1", nombre: "Emprendimiento I", codigo: "C7-EM1", creditos: 2 },
          { id: "c7-i5", nombre: "Inglés V", codigo: "C7-I5", creditos: 2 }
      ]
    },
    {
      numero: 8,
      materias: [
          { id: "c8-ed2", nombre: "Electiva Disciplinar II", codigo: "C8-ED2", creditos: 2 },
          { id: "c8-ecomm", nombre: "E-Commerce", codigo: "C8-ECOMM", creditos: 1 },
          { id: "c8-in", nombre: "Inteligencia de Negocios", codigo: "C8-IN", creditos: 2 },
          { id: "c8-la", nombre: "Logística de Aprovisionamiento", codigo: "C8-LA", creditos: 2 },
          { id: "c8-e2", nombre: "Empleabilidad II", codigo: "C8-E2", creditos: 1 },
          { id: "c8-em2", nombre: "Emprendimiento II", codigo: "C8-EM2", creditos: 1 },
          { id: "c8-p2", nombre: "Proyectos II", codigo: "C8-P2", creditos: 1 }
      ]
    },
    {
      numero: 9,
      materias: [
          { id: "c9-ed3", nombre: "Electiva Disciplinar III", codigo: "C9-ED3", creditos: 2 },
          { id: "c9-en", nombre: "Estrategias de Negociación", codigo: "C9-EN", creditos: 2 },
          { id: "c9-si", nombre: "Sistemas de Información OPEN COMEX Y ERP", codigo: "C9-SI", creditos: 2 },
          { id: "c9-mm", nombre: "Mantenimiento de Mercancías", codigo: "C9-MM", creditos: 2 },
          { id: "c9-gp", nombre: "Gestión de Proyectos", codigo: "C9-GP", creditos: 2 }
      ]
    }
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

export async function seedInitialData() {
    const saltRounds = 10;
    const testUsers = [
        {
            id: "admin01",
            nombre1: "Admin",
            apellido1: "User",
            correoInstitucional: "admin@example.com",
            rol: { id: "admin", descripcion: "Administrador" },
            contrasena: "Admin123."
        },
        {
            id: "gestor01",
            nombre1: "Gestor",
            apellido1: "User",
            correoInstitucional: "gestor@example.com",
            rol: { id: "gestor", descripcion: "Gestor" },
            contrasena: "Gestor123."
        },
        {
            id: "docente01",
            nombre1: "Docente",
            apellido1: "User",
            correoInstitucional: "docente@example.com",
            rol: { id: "docente", descripcion: "Docente" },
            contrasena: "Docente123."
        },
        {
            id: "est001",
            nombre1: "Estudiante",
            apellido1: "User",
            correoInstitucional: "estudiante@example.com",
            rol: { id: "estudiante", descripcion: "Estudiante" },
            contrasena: "Estudiante123."
        }
    ];

    try {
        const batch = writeBatch(db);
        const usersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const studentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes");

        const existingUsersSnapshot = await getDocs(usersRef);
        const existingEmails = new Set(existingUsersSnapshot.docs.map(doc => doc.data().correoInstitucional));

        for (const userData of testUsers) {
            if (!existingEmails.has(userData.correoInstitucional)) {
                const hashedPassword = await bcrypt.hash(userData.contrasena, saltRounds);
                
                const userDocRef = doc(usersRef, userData.id);
                const finalUserData: any = {
                    ...userData,
                    nombreCompleto: `${userData.nombre1} ${userData.apellido1}`,
                    identificacion: `ID-${userData.id}`,
                    contrasena: hashedPassword,
                    estado: "activo",
                    fechaRegistro: new Date()
                };
                batch.set(userDocRef, finalUserData);

                if (userData.rol.id === 'estudiante') {
                    const studentDocRef = doc(studentsRef, userData.id);
                    batch.set(studentDocRef, {
                        usuarioId: userData.id,
                        nombreCompleto: finalUserData.nombreCompleto,
                        documento: finalUserData.identificacion,
                        carrera: "Carrera de Prueba",
                        modalidad: "Virtual",
                        grupo: "G-001",
                        correoInstitucional: userData.correoInstitucional,
                        cicloActual: 1,
                        materiasInscritas: [],
                        estado: "activo",
                        fechaRegistro: new Date()
                    });
                }
            } else {
                 console.log(`El usuario ${userData.correoInstitucional} ya existe. Omitiendo.`);
            }
        }

        await batch.commit();
        return { success: true, message: "Datos iniciales (usuarios y estudiantes) creados o verificados exitosamente." };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        console.error("Error en seedInitialData:", error);
        return { success: false, message: errorMessage };
    }
}
