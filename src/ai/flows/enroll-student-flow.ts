
'use server';
/**
 * @fileOverview A system to finalize a student's enrollment after admin approval.
 *
 * - processStudentEnrollment - A function that activates a student, assigns a cycle and subjects, and sends a welcome email.
 * - ProcessStudentEnrollmentInput - The input type for the function.
 * - ProcessStudentEnrollmentOutput - The return type for the function.
 */

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, query, where, getDocs, writeBatch, serverTimestamp, addDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { sendWelcomeEmail } from './send-welcome-email';
import bcrypt from "bcryptjs";


// Helper function to generate a secure temporary password
const generateTemporaryPassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0, n = charset.length; i < n; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
};

async function emailExists(email: string): Promise<boolean> {
    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correoInstitucional", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

async function generateUniqueInstitutionalEmail(firstName: string, lastName1: string, lastName2?: string): Promise<string> {
    const domain = "@pi.edu.co";
    const namePart = firstName.toLowerCase().split(' ')[0];
    const lastName1Part = lastName1.toLowerCase().split(' ')[0];
    const lastName2Part = lastName2 ? lastName2.toLowerCase().split(' ')[0] : '';
    
    let baseEmail = [namePart, lastName1Part, lastName2Part].filter(Boolean).join('.');
    
    // Normalize email by removing accents and special characters
    baseEmail = baseEmail.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let finalEmail = `${baseEmail}${domain}`;
    let counter = 1;

    while (await emailExists(finalEmail)) {
        finalEmail = `${baseEmail}${counter}${domain}`;
        counter++;
    }
    return finalEmail;
}


// Input and Output types
export interface ProcessStudentEnrollmentInput {
  studentId: string; // The document ID of the student in the 'estudiantes' collection
}

export interface ProcessStudentEnrollmentOutput {
  success: boolean;
  message: string;
  studentId?: string;
  calculatedCycle?: number;
  enrolledSubjectsCount?: number;
  institutionalEmail?: string;
}

function calculateStartCycle(currentDate: Date): number {
  // Simple logic: if registering in the first half of the year, cycle is 1, else cycle is 2 for the next year.
  // This can be made more complex based on specific academic calendar dates.
  return 1;
}

export async function processStudentEnrollment(input: ProcessStudentEnrollmentInput): Promise<ProcessStudentEnrollmentOutput> {
    const { studentId } = input;
    const batch = writeBatch(db);

    try {
        const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", studentId);
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", studentId);

        const studentSnap = await getDoc(studentRef);
        const userSnap = await getDoc(userRef);

        if (!studentSnap.exists() || !userSnap.exists()) {
            throw new Error("No se encontró al estudiante o al usuario correspondiente.");
        }

        const studentData = studentSnap.data();
        const userData = userSnap.data();
        
        if (studentData.estado === 'aprobado' || userData.estado === 'activo') {
            return { success: false, message: 'Este estudiante ya ha sido inscrito y activado.' };
        }
        
        if (!studentData.initialPassword) {
            throw new Error("No se encontró la contraseña inicial para el estudiante. No se puede proceder.");
        }

        // Fetch career data
        const careerRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", studentData.carreraId);
        const careerSnap = await getDoc(careerRef);
        if (!careerSnap.exists()) {
            throw new Error(`No se encontró la carrera con ID ${studentData.carreraId}`);
        }
        const careerData = careerSnap.data();

        const currentDate = new Date();
        const startCycle = calculateStartCycle(currentDate);
        const cycleInfo = careerData.ciclos.find((c: any) => c.numero === startCycle);

        if (!cycleInfo) {
            throw new Error(`El ciclo de inicio ${startCycle} no fue encontrado en la malla curricular.`);
        }
        
        const assignedSubjects = cycleInfo.materias.map((m: any) => ({ id: m.id, nombre: m.nombre, creditos: m.creditos }));
        const institutionalEmail = await generateUniqueInstitutionalEmail(userData.nombre1, userData.apellido1, userData.apellido2);
        const temporaryPassword = studentData.initialPassword; 
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        
        // --- START: Auto-assign student to groups ---
        const groupsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");
        let assignedGroup = studentData.grupo; // The pre-selected group from registration

        if (!assignedGroup || assignedGroup === 'PENDIENTE') {
            const q = query(
                groupsRef,
                where("idCarrera", "==", studentData.carreraId),
                where("idSede", "==", studentData.sedeId),
                where("ciclo", "==", startCycle)
            );
            const groupsSnapshot = await getDocs(q);
            if (!groupsSnapshot.empty) {
                // Assign to the first available group found
                const firstGroup = groupsSnapshot.docs[0];
                assignedGroup = firstGroup.id;
            } else {
                 console.warn(`No se encontró un grupo para el estudiante ${studentId} en la carrera ${studentData.carreraId} y sede ${studentData.sedeId}.`);
            }
        }
        
        // Ensure student is added to the assigned group
        if (assignedGroup && assignedGroup !== 'PENDIENTE') {
            const groupRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos", assignedGroup);
            batch.update(groupRef, {
                estudiantes: arrayUnion({ id: studentId, nombre: userData.nombreCompleto })
            });
        }
        // --- END: Auto-assign student to groups ---
        
        // Handle invoice generation
        const cyclePrice = careerData.precioPorCiclo?.[startCycle];
        const paymentsRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos");
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        if (cyclePrice === undefined || cyclePrice === null) {
            console.error(`Precio para el ciclo ${startCycle} no encontrado en la carrera ${studentData.carreraId}.`);
            // Create invoice with 0 amount and 'incomplete' status
            const newPaymentDoc = doc(paymentsRef);
            batch.set(newPaymentDoc, {
                idEstudiante: studentId,
                idCarrera: studentData.carreraId,
                ciclo: startCycle,
                monto: 0,
                estado: "incompleta",
                fechaGeneracion: Timestamp.fromDate(invoiceDate),
                fechaMaximaPago: Timestamp.fromDate(dueDate),
                fechaPago: null
            });
        } else {
            const newPaymentDoc = doc(paymentsRef);
            batch.set(newPaymentDoc, {
                idEstudiante: studentId,
                idCarrera: studentData.carreraId,
                ciclo: startCycle,
                monto: Number(cyclePrice) || 0,
                estado: "pendiente",
                fechaGeneracion: Timestamp.fromDate(invoiceDate),
                fechaMaximaPago: Timestamp.fromDate(dueDate),
                fechaPago: null
            });
        }

        batch.update(studentRef, {
            estado: 'aprobado',
            estaInscrito: true,
            cicloActual: startCycle,
            materiasInscritas: assignedSubjects,
            correoInstitucional: institutionalEmail,
            fechaActualizacion: serverTimestamp(),
            initialPassword: null, 
            grupo: assignedGroup, // Update the group in student's record
        });
        
        batch.update(userRef, {
            correoInstitucional: institutionalEmail,
            rol: { id: "estudiante", descripcion: "Estudiante" },
            contrasena: hashedPassword,
            estado: "activo",
            fechaActualizacion: serverTimestamp(),
        });

        await batch.commit();

        const emailResult = await sendWelcomeEmail({
            name: userData.nombre1,
            email: userData.correo,
            institutionalEmail: institutionalEmail,
            temporaryPassword: temporaryPassword,
        });

        const finalMessage = emailResult.success
            ? "El estudiante ha sido inscrito exitosamente, se ha generado su factura y se ha enviado un correo de bienvenida."
            : `El estudiante fue inscrito, pero hubo un error al enviar el correo: ${emailResult.message}`;

        return {
            success: true,
            message: finalMessage,
            studentId: studentId,
            calculatedCycle: startCycle,
            enrolledSubjectsCount: assignedSubjects.length,
            institutionalEmail: institutionalEmail
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        console.error(`[enroll-student-flow] Error processing enrollment for ${studentId}:`, {
            code: (error as any).code,
            message: message,
            stack: (error as any).stack,
        });
        return { success: false, message };
    }
}
