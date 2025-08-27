
/**
 * @fileOverview Script para poblar la base de datos con datos iniciales (seeding).
 * Este archivo contiene los datos de la carrera 'Tecnología en Comercio Exterior y Negocios Internacionales'.
 * Para usarlo, puedes adaptar este script para que se conecte a tu instancia de Firestore
 * y cree el documento correspondiente en la colección 'carreras'.
 *
 * Este script NO se ejecuta automáticamente. Es una plantilla para facilitar la inserción de datos.
 */

import { v4 as uuidv4 } from 'uuid';

// Datos de la carrera extraídos de la imagen proporcionada.
export const carreraData = {
  nombre: "Tecnología en Comercio Exterior y Negocios Internacionales",
  descripcion: "Gestiona los procesos de importación definitiva (para consumo, con franquicia, en cumplimiento de garantía y reimportaciones) de productos al país, a partir de la planificación logística de sus operaciones, integrando y adecuando documentos, costos, medios de pago y requisitos conformes con la normatividad vigente en Colombia, con el fin de generar procesos rentables y eficientes.",
  perfilProfesional: "El Tecnólogo en Comercio Exterior y Negocios Internacionales, gestiona procesos de importación, exportación y logística de las operaciones de comercio nacional e internacional, cumpliendo con los requerimientos de la normatividad vigente y las oportunidades comerciales para apoyar los procesos de negociación, diseñando e implementando proyectos de desarrollo empresarial en comercio internacional.",
  imagenURL: "https://placehold.co/1920x1080/002147/FFFFFF?text=Comercio+Exterior",
  ciclos: [
    {
      numero: 1,
      materias: [
        { id: uuidv4(), nombre: "Matemática Básica" },
        { id: uuidv4(), nombre: "Clasificación Arancelaria" },
        { id: uuidv4(), nombre: "Introducción al Comercio Exterior" },
        { id: uuidv4(), nombre: "Acuerdos Internacionales y Geopolítica" },
        { id: uuidv4(), nombre: "TIC" }
      ]
    },
    {
      numero: 2,
      materias: [
        { id: uuidv4(), nombre: "Competencias Comunicativas" },
        { id: uuidv4(), nombre: "Estadística" },
        { id: uuidv4(), nombre: "Legislación Aduanera" },
        { id: uuidv4(), nombre: "Marketing Internacional" },
        { id: uuidv4(), nombre: "Fundamentos de Economía" },
        { id: uuidv4(), nombre: "Plan de Vida" }
      ]
    },
    {
      numero: 3,
      materias: [
        { id: uuidv4(), nombre: "Procesos de Importación I" },
        { id: uuidv4(), nombre: "Procesos de Exportación I" },
        { id: uuidv4(), nombre: "Medios de Pago y Coberturas Cambiarias" },
        { id: uuidv4(), nombre: "Cambios Internacionales" },
        { id: uuidv4(), nombre: "Inglés I" }
      ]
    },
    {
      numero: 4,
      materias: [
        { id: uuidv4(), nombre: "Costos y Presupuestos" },
        { id: uuidv4(), nombre: "Procesos de Importación II" },
        { id: uuidv4(), nombre: "Procesos de Exportación II" },
        { id: uuidv4(), nombre: "Cadena de Abastecimiento y Alistamiento" },
        { id: uuidv4(), nombre: "Inglés II" }
      ]
    },
    {
      numero: 5,
      materias: [
        { id: uuidv4(), nombre: "Procesos de Importación III" },
        { id: uuidv4(), nombre: "Procesos de Exportación III" },
        { id: uuidv4(), nombre: "Orientación a la Empleabilidad" },
        { id: uuidv4(), nombre: "Inglés III" }
      ]
    },
    {
      numero: 6,
      materias: [
        { id: uuidv4(), nombre: "Participación Ciudadana" },
        { id: uuidv4(), nombre: "Comercialización Internacional de Servicios" },
        { id: uuidv4(), nombre: "Zonas Francas" },
        { id: uuidv4(), nombre: "Distribución Física Internacional" },
        { id: uuidv4(), nombre: "Orientación al Emprendimiento" },
        { id: uuidv4(), nombre: "Proyectos I" },
        { id: uuidv4(), nombre: "Inglés IV" }
      ]
    },
    {
      numero: 7,
      materias: [
        { id: uuidv4(), nombre: "Electiva Disciplinar I" },
        { id: uuidv4(), nombre: "Negociaciones y Contratos Internacionales" },
        { id: uuidv4(), nombre: "Tráfico y Transporte" },
        { id: uuidv4(), nombre: "Empleabilidad I" },
        { id: uuidv4(), nombre: "Emprendimiento I" },
        { id: uuidv4(), nombre: "Inglés V" }
      ]
    },
    {
      numero: 8,
      materias: [
        { id: uuidv4(), nombre: "Electiva Disciplinar II" },
        { id: uuidv4(), nombre: "E-Commerce" },
        { id: uuidv4(), nombre: "Inteligencia de Negocios" },
        { id: uuidv4(), nombre: "Logística de Aprovisionamiento" },
        { id: uuidv4(), nombre: "Empleabilidad II" },
        { id: uuidv4(), nombre: "Emprendimiento II" },
        { id: uuidv4(), nombre: "Proyectos II" }
      ]
    },
    {
      numero: 9,
      materias: [
        { id: uuidv4(), nombre: "Electiva Disciplinar III" },
        { id: uuidv4(), nombre: "Estrategias de Negociación" },
        { id: uuidv4(), nombre: "Sistemas de Información OPEN COMEX Y ERP" },
        { id: uuidv4(), nombre: "Mantenimiento de Mercancías" },
        { id: uuidv4(), nombre: "Gestión de Proyectos" }
      ]
    }
  ]
};

// Ejemplo de cómo podrías usar esto en un script de inicialización:
/*
import { db } from './firebase'; // Asegúrate de que la ruta a tu configuración de firebase sea correcta
import { collection, addDoc } from 'firebase/firestore';

async function seedDatabase() {
  try {
    const carrerasRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
    await addDoc(carrerasRef, carreraData);
    console.log("Datos de carrera insertados exitosamente.");
  } catch (error) {
    console.error("Error insertando datos de carrera:", error);
  }
}

// Llama a la función para ejecutar el seeder.
// seedDatabase();

*/
