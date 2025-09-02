
'use server';
/**
 * @fileOverview A system to finalize a student's enrollment after admin approval.
 *
 * - processStudentEnrollment - A function that activates a student, assigns a cycle and subjects, and sends a welcome email.
 * - ProcessStudentEnrollmentInput - The input type for the function.
 * - ProcessStudentEnrollmentOutput - The return type for the function.
 */

import { carreraData } from '@/lib/seed';
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { sendWelcomeEmail } from './send-welcome-email';

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

async function generateUniqueInstitutionalEmail(firstName: string, lastName1: string, lastName2: string): Promise<string> {
    const domain = "@pi.edu.co";
    const baseEmail = [
        firstName.toLowerCase().split(' ')[0],
        lastName1.toLowerCase().split(' ')[0],
        lastName2.toLowerCase().split(' ')[0]
    ].join('.');
    
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
  const currentMonth = currentDate.getMonth(); // 0-indexed (Jan=0, Jul=6)
  // If enrollment happens in the first half of the year (before July), they start in Cycle 1 of that year.
  // If in the second half, they also start in Cycle 1 (as it's their first semester).
  // The logic simplifies to always starting in cycle 1.
  return 1;
}

export async function processStudentEnrollment(input: ProcessStudentEnrollmentInput): Promise<ProcessStudentEnrollmentOutput> {
    const { studentId } = input;

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
        
        if (studentData.estado === 'inscrito') {
            return { success: false, message: 'Este estudiante ya ha sido inscrito.' };
        }

        // 1. Calculate Cycle and Assign Subjects
        const currentDate = new Date();
        const startCycle = calculateStartCycle(currentDate);
        const cycleInfo = carreraData.ciclos.find(c => c.numero === startCycle);

        if (!cycleInfo) {
            throw new Error(`El ciclo de inicio ${startCycle} no fue encontrado en la malla curricular.`);
        }
        
        const assignedSubjects = cycleInfo.materias;

        // 2. Generate Institutional Email & Temporary Password
        const institutionalEmail = await generateUniqueInstitutionalEmail(userData.nombre1, userData.apellido1, userData.apellido2);
        const temporaryPassword = generateTemporaryPassword();
        
        // In a real scenario, you would HASH this password before storing it.
        // For now, we assume a separate step or API handles that.
        // Let's just update the user doc with the email.
        
        // 3. Update Firestore Documents
        await updateDoc(studentRef, {
            estado: 'inscrito',
            cicloActual: startCycle,
            materiasInscritas: assignedSubjects,
            correoInstitucional: institutionalEmail,
            fechaActualizacion: new Date(),
        });
        
        await updateDoc(userRef, {
            correoInstitucional: institutionalEmail,
            rol: { id: "estudiante", descripcion: "Estudiante" },
            // Here you would store the HASHED temporaryPassword
            // contrasena: await bcrypt.hash(temporaryPassword, 10),
            fechaActualizacion: new Date(),
        });

        // 4. Send Welcome Email
        await sendWelcomeEmail({
            name: userData.nombre1,
            email: userData.correo,
            institutionalEmail: institutionalEmail,
            temporaryPassword: temporaryPassword, // Send the plain text password
        });

        return {
            success: true,
            message: "El estudiante ha sido inscrito exitosamente. Se ha enviado un correo de bienvenida.",
            studentId: studentId,
            calculatedCycle: startCycle,
            enrolledSubjectsCount: assignedSubjects.length,
            institutionalEmail: institutionalEmail
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        console.error("Error processing enrollment:", error);
        return { success: false, message };
    }
}
