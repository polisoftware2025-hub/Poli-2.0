
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

// ========================================================================================
// 1. DATA VALIDATION (Zod Schema)
// This schema defines the expected shape and types of data from the frontend.
// It acts as the first line of defense.
// ========================================================================================
const UserRegistrationSchema = z.object({
    firstName: z.string().min(2, "El primer nombre es requerido."),
    segundoNombre: z.string().optional(),
    lastName: z.string().min(2, "El primer apellido es requerido."),
    segundoApellido: z.string().min(2, "El segundo apellido es requerido."),
    tipoIdentificacion: z.string(),
    numeroIdentificacion: z.string().min(5, "El número de identificación es requerido."),
    gender: z.string(),
    birthDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
    phone: z.string().regex(/^\d{7,15}$/, "El teléfono no es válido."),
    address: z.string().min(5, "La dirección es requerida."),
    country: z.string(),
    city: z.string(),
    correoPersonal: z.string().email("El correo personal no es válido."),
    carreraId: z.string(),
    modalidad: z.string(),
    grupo: z.string(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});


// ========================================================================================
// 3. HELPER FUNCTIONS
// - generateUniqueInstitutionalEmail: Creates a unique email for the student.
// ========================================================================================
async function generateUniqueInstitutionalEmail(nombre1: string, apellido1: string, apellido2?: string): Promise<string> {
    const domain = "@pi.edu.co";
    // Ensure parts are lowercase and use only the first word if there are spaces
    const namePart = nombre1.toLowerCase().split(' ')[0];
    const lastName1Part = apellido1.toLowerCase().split(' ')[0];
    const lastName2Part = apellido2 ? apellido2.toLowerCase().split(' ')[0] : '';
    
    const baseEmail = [namePart, lastName1Part, lastName2Part].filter(Boolean).join('.');
    
    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    let finalEmail = `${baseEmail}${domain}`;
    let counter = 1;
    let emailExists = true;

    while (emailExists) {
        const q = query(usuariosRef, where("correoInstitucional", "==", finalEmail));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            emailExists = false;
        } else {
            finalEmail = `${baseEmail}${counter}${domain}`;
            counter++;
        }
    }
    return finalEmail;
}


// ========================================================================================
// 4. MAIN API ENDPOINT (POST)
// ========================================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Body recibido en /api/register-user:", JSON.stringify(body, null, 2));


        // Step 1: Validate incoming data with Zod
        const validation = UserRegistrationSchema.safeParse(body);
        if (!validation.success) {
            console.error("Zod Validation Errors:", validation.error.flatten());
            return NextResponse.json({ 
                message: "Datos de entrada inválidos.", 
                errors: validation.error.flatten().fieldErrors 
            }, { status: 400 });
        }
        
        let data = validation.data;

        // Step 2: Check if user already exists
        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", data.numeroIdentificacion));
        const existingUserSnapshot = await getDocs(q);

        if (!existingUserSnapshot.empty) {
            return NextResponse.json({ message: "Ya existe un usuario con este número de identificación." }, { status: 409 });
        }
        
        // Step 3: Prepare and Sanitize data for Firestore
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const institutionalEmail = await generateUniqueInstitutionalEmail(data.firstName, data.lastName, data.segundoApellido);

        const newUserId = data.numeroIdentificacion; // Use identification number as document ID
        
        const usuarioData = {
          nombreCompleto: `${data.firstName} ${data.segundoNombre || ''} ${data.lastName} ${data.segundoApellido}`.replace(/\s+/g, ' ').trim(),
          nombre1: data.firstName,
          nombre2: data.segundoNombre || "", // Ensure it's a string, not undefined
          apellido1: data.lastName,
          apellido2: data.segundoApellido,
          tipoIdentificacion: data.tipoIdentificacion,
          identificacion: data.numeroIdentificacion,
          genero: data.gender,
          fechaNacimiento: Timestamp.fromDate(new Date(data.birthDate)), // Normalize to Firestore Timestamp
          telefono: data.phone,
          direccion: data.address,
          ciudad: data.city,
          pais: data.country,
          correo: data.correoPersonal,
          correoInstitucional: institutionalEmail,
          contrasena: hashedPassword,
          rol: { id: "aspirante", descripcion: "Aspirante" },
          estado: "pendiente",
          fechaRegistro: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
        };
        
        const estudianteData = {
          usuarioId: newUserId,
          nombreCompleto: usuarioData.nombreCompleto,
          documento: data.numeroIdentificacion,
          carreraId: data.carreraId,
          modalidad: data.modalidad,
          grupo: data.grupo,
          correoInstitucional: "", 
          cicloActual: null,
          materiasInscritas: [],
          estado: "pendiente", 
          fechaRegistro: serverTimestamp()
        };
        
        // Step 4: Write to Firestore using a transaction (batch)
        const batch = writeBatch(db);
        const politecnicoDocRef = doc(db, "Politecnico", "mzIX7rzezDezczAV6pQ7");
        
        const newUserDocRef = doc(collection(politecnicoDocRef, "usuarios"), newUserId);
        const newStudentDocRef = doc(collection(politecnicoDocRef, "estudiantes"), newUserId);

        batch.set(newUserDocRef, sanitizeForFirestore(usuarioData));
        batch.set(newStudentDocRef, sanitizeForFirestore(estudianteData));
        
        await batch.commit();
        
        return NextResponse.json({ 
            message: "Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud.", 
            userId: newUserId 
        }, { status: 201 });

    } catch (error: any) {
        // Step 5: Detailed Error Logging
        console.error("Error en /api/register-user:", {
            code: error.code || 'UNKNOWN_CODE',
            message: error.message || 'Unknown error occurred.',
            stack: error.stack
        });

        // Provide a generic but informative error to the client
        return NextResponse.json({ 
            message: "Error interno del servidor. No se pudo completar el registro." 
        }, { status: 500 });
    }
}
