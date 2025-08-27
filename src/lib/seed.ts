
import { db } from './firebase'; 
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  duracionCiclo: "N/A", // Not specified in image, can be updated
  modalidad: "N/A", // Not specified in image, can be updated
  descripcionGeneral: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  descripcionAprendizaje: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
  imagenURL: "https://placehold.co/800x400/002147/FFFFFF?text=Comercio+Exterior", // Placeholder URL
  materias: [
    // Ciclo I
    { id: uuidv4(), nombre: "Matemática Básica", codigo: "C1-MB" },
    { id: uuidv4(), nombre: "Clasificación Arancelaria", codigo: "C1-CA" },
    { id: uuidv4(), nombre: "Introducción al Comercio Exterior", codigo: "C1-ICE" },
    { id: uuidv4(), nombre: "Acuerdos Internacionales y Geopolítica", codigo: "C1-AIG" },
    { id: uuidv4(), nombre: "TIC", codigo: "C1-TIC" },
    // Ciclo II
    { id: uuidv4(), nombre: "Competencias Comunicativas", codigo: "C2-CC" },
    { id: uuidv4(), nombre: "Estadística", codigo: "C2-E" },
    { id: uuidv4(), nombre: "Legislación Aduanera", codigo: "C2-LA" },
    { id: uuidv4(), nombre: "Marketing Internacional", codigo: "C2-MI" },
    { id: uuidv4(), nombre: "Fundamentos de Economía", codigo: "C2-FE" },
    { id: uuidv4(), nombre: "Plan de Vida", codigo: "C2-PV" },
    // Ciclo III
    { id: uuidv4(), nombre: "Procesos de Importación I", codigo: "C3-PI1" },
    { id: uuidv4(), nombre: "Procesos de Exportación I", codigo: "C3-PE1" },
    { id: uuidv4(), nombre: "Medios de Pago y Coberturas Cambiarias", codigo: "C3-MPCC" },
    { id: uuidv4(), nombre: "Cambios Internacionales", codigo: "C3-CI" },
    { id: uuidv4(), nombre: "Inglés I", codigo: "C3-I1" },
    // Ciclo IV
    { id: uuidv4(), nombre: "Costos y Presupuestos", codigo: "C4-CP" },
    { id: uuidv4(), nombre: "Procesos de Importación II", codigo: "C4-PI2" },
    { id: uuidv4(), nombre: "Procesos de Exportación II", codigo: "C4-PE2" },
    { id: uuidv4(), nombre: "Cadena de Abastecimiento y Alistamiento", codigo: "C4-CAA" },
    { id: uuidv4(), nombre: "Inglés II", codigo: "C4-I2" },
    // Ciclo V
    { id: uuidv4(), nombre: "Procesos de Importación III", codigo: "C5-PI3" },
    { id: uuidv4(), nombre: "Procesos de Exportación III", codigo: "C5-PE3" },
    { id: uuidv4(), nombre: "Orientación a la Empleabilidad", codigo: "C5-OE" },
    { id: uuidv4(), nombre: "Inglés III", codigo: "C5-I3" },
    // Ciclo VI
    { id: uuidv4(), nombre: "Participación Ciudadana", codigo: "C6-PC" },
    { id: uuidv4(), nombre: "Comercialización Internacional de Servicios", codigo: "C6-CIS" },
    { id: uuidv4(), nombre: "Zonas Francas", codigo: "C6-ZF" },
    { id: uuidv4(), nombre: "Distribución Física Internacional", codigo: "C6-DFI" },
    { id: uuidv4(), nombre: "Orientación al Emprendimiento", codigo: "C6-OE2" },
    { id: uuidv4(), nombre: "Proyectos I", codigo: "C6-P1" },
    { id: uuidv4(), nombre: "Inglés IV", codigo: "C6-I4" },
    // Ciclo VII
    { id: uuidv4(), nombre: "Electiva Disciplinar I", codigo: "C7-ED1" },
    { id: uuidv4(), nombre: "Negociaciones y Contratos Internacionales", codigo: "C7-NCI" },
    { id: uuidv4(), nombre: "Tráfico y Transporte", codigo: "C7-TT" },
    { id: uuidv4(), nombre: "Empleabilidad I", codigo: "C7-E1" },
    { id: uuidv4(), nombre: "Emprendimiento I", codigo: "C7-EM1" },
    { id: uuidv4(), nombre: "Inglés V", codigo: "C7-I5" },
    // Ciclo VIII
    { id: uuidv4(), nombre: "Electiva Disciplinar II", codigo: "C8-ED2" },
    { id: uuidv4(), nombre: "E-Commerce", codigo: "C8-EC" },
    { id: uuidv4(), nombre: "Inteligencia de Negocios", codigo: "C8-IN" },
    { id: uuidv4(), nombre: "Logística de Aprovisionamiento", codigo: "C8-LA" },
    { id: uuidv4(), nombre: "Empleabilidad II", codigo: "C8-E2" },
    { id: uuidv4(), nombre: "Emprendimiento II", codigo: "C8-EM2" },
    { id: uuidv4(), nombre: "Proyectos II", codigo: "C8-P2" },
    // Ciclo IX
    { id: uuidv4(), nombre: "Electiva Disciplinar III", codigo: "C9-ED3" },
    { id: uuidv4(), nombre: "Estrategias de Negociación", codigo: "C9-EN" },
    { id: uuidv4(), nombre: "Sistemas de Información OPEN COMEX Y ERP", codigo: "C9-SI" },
    { id: uuidv4(), nombre: "Mantenimiento de Mercancías", codigo: "C9-MM" },
    { id: uuidv4(), nombre: "Gestión de Proyectos", codigo: "C9-GP" }
  ]
};

export async function seedCarrera() {
  try {
    const carrerasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
    
    // Check if the career already exists
    const q = query(carrerasRef, where("nombre", "==", carreraData.nombre));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("La carrera ya existe en la base de datos.");
      throw new Error("La carrera 'Tecnología en Comercio Exterior y Negocios Internacionales' ya existe.");
    }
    
    await addDoc(carrerasRef, carreraData);
    console.log("Datos de carrera insertados exitosamente.");
    return { success: true, message: "Datos de carrera insertados exitosamente." };
  } catch (error) {
    console.error("Error insertando datos de carrera:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, message: errorMessage };
  }
}
