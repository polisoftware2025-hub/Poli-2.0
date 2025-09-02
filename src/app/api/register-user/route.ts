
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

// ========================================================================================
// 1. DATA VALIDATION SCHEMA (Zod)
// This schema defines the expected shape and types for the registration data.
// It's the single source of truth for validation on the backend.
// ========================================================================================
const UserRegistrationSchema = z.object({
    // --- Personal Info ---
    firstName: z.string().min(2, "El primer nombre es requerido."),
    segundoNombre: z.string().optional(),
    lastName: z.string().min(2, "El primer apellido es requerido."),
    segundoApellido: z.string().min(2, "El segundo apellido es requerido."),
    tipoIdentificacion: z.string(),
    numeroIdentificacion: z.string().min(5, "El número de identificación es requerido."),
    gender: z.string(),
    birthDate: z.date({ invalid_type_error: "La fecha de nacimiento no es válida." }),
    // --- Contact Info ---
    phone: z.string().regex(/^\d{7,15}$/, "El teléfono no es válido."),
    address: z.string().min(5, "La dirección es requerida."),
    country: z.string(),
    city: z.string(),
    correoPersonal: z.string().email("El correo personal no es válido."),
    // --- Academic Info ---
    carreraId: z.string(),
    modalidad: z.string(),
    grupo: z.string(),
    // --- Credentials ---
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

// ========================================================================================
// 2. HELPER FUNCTIONS
// - generateUniqueInstitutionalEmail: Creates a unique email to avoid collisions.
// ========================================================================================
async function generateUniqueInstitutionalEmail(nombre1: string, apellido1: string, apellido2?: string): Promise<string> {
    const domain = "@pi.edu.co";
    const namePart = nombre1.toLowerCase().split(' ')[0];
    const lastName1Part = apellido1.toLowerCase().split(' ')[0];
    // Use second last name only if it exists and is not an empty string
    const lastName2Part = apellido2 ? apellido2.toLowerCase().split(' ')[0] : '';
    
    // Construct base email, filtering out any empty parts
    const baseEmail = [namePart, lastName1Part, lastName2Part].filter(Boolean).join('.');
    
    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    let finalEmail = `${baseEmail}${domain}`;
    let counter = 1;

    // Loop until a unique email is found
    while (true) {
        const q = query(usuariosRef, where("correoInstitucional", "==", finalEmail));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            break; // Email is unique
        }
        // If email exists, append a counter and check again
        finalEmail = `${baseEmail}${counter}${domain}`;
        counter++;
    }
    return finalEmail;
}


// ========================================================================================
// 3. MAIN API ENDPOINT (POST)
// ========================================================================================
export async function POST(req: Request) {
    let rawBody;
    try {
        rawBody = await req.json();
        console.log("Body recibido en /api/register-user:", JSON.stringify(rawBody, null, 2));
    } catch (error) {
        return NextResponse.json({ message: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
    }

    // Step 1: Pre-process and normalize incoming data
    const processedBody = {
        ...rawBody,
        // Ensure date is a Date object, not a string
        birthDate: rawBody.birthDate ? new Date(rawBody.birthDate) : undefined,
    };

    // Step 2: Validate incoming data with Zod
    const validation = UserRegistrationSchema.safeParse(processedBody);

    if (!validation.success) {
        console.error("Zod Validation Errors:", validation.error.flatten());
        return NextResponse.json({ 
            message: "Datos de entrada inválidos. Por favor, revisa los campos marcados.", 
            errors: validation.error.flatten().fieldErrors 
        }, { status: 400 });
    }
    
    // From now on, use the validated and typed data
    const data = validation.data;

    try {
        // Step 3: Check if user already exists
        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", data.numeroIdentificacion));
        const existingUserSnapshot = await getDocs(q);

        if (!existingUserSnapshot.empty) {
            return NextResponse.json({ message: "Ya existe un usuario con este número de identificación." }, { status: 409 });
        }
        
        // Step 4: Prepare and Sanitize data for Firestore
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const institutionalEmail = await generateUniqueInstitutionalEmail(data.firstName, data.lastName, data.segundoNombre);

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
          fechaNacimiento: Timestamp.fromDate(data.birthDate), // Convert to Firestore Timestamp
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
          correoInstitucional: "", // Will be filled upon approval
          cicloActual: null, // Initial cycle is null
          materiasInscritas: [], // Empty on registration
          estado: "pendiente", // Initial state
          fechaRegistro: serverTimestamp()
        };
        
        // Step 5: Write to Firestore using a transaction (batch) for atomicity
        const batch = writeBatch(db);
        const politecnicoDocRef = doc(db, "Politecnico", "mzIX7rzezDezczAV6pQ7");
        
        const newUserDocRef = doc(collection(politecnicoDocRef, "usuarios"), newUserId);
        const newStudentDocRef = doc(collection(politecnicoDocRef, "estudiantes"), newUserId);

        // Sanitize objects before setting them to remove any undefined values
        batch.set(newUserDocRef, sanitizeForFirestore(usuarioData));
        batch.set(newStudentDocRef, sanitizeForFirestore(estudianteData));
        
        await batch.commit();
        
        return NextResponse.json({ 
            message: "Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud.", 
            userId: newUserId 
        }, { status: 201 });

    } catch (error: any) {
        // Step 6: Detailed Error Logging for Firestore or other exceptions
        console.error("Error en /api/register-user:", {
            code: error.code || 'UNKNOWN_SERVER_ERROR',
            message: error.message || 'Unknown error occurred.',
            stack: error.stack
        });
        
        // Provide a generic but informative error to the client
        return NextResponse.json({ 
            message: "Error interno del servidor. No se pudo completar el registro." 
        }, { status: 500 });
    }
}
