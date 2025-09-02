
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

// Schema for backend validation, must match the frontend logic.
const UserRegistrationSchema = z.object({
    firstName: z.string().min(1, "El primer nombre es requerido."),
    segundoNombre: z.string().optional(),
    lastName: z.string().min(1, "El primer apellido es requerido."),
    segundoApellido: z.string().min(1, "El segundo apellido es requerido."),
    tipoIdentificacion: z.string().min(1),
    numeroIdentificacion: z.string().min(5, "El número de identificación es requerido."),
    gender: z.string().min(1),
    birthDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    phone: z.string().min(7, "El teléfono no es válido."),
    address: z.string().min(5, "La dirección es requerida."),
    country: z.string().min(1),
    city: z.string().min(1),
    correoPersonal: z.string().email("El correo personal no es válido."),
    carreraId: z.string().min(1),
    modalidad: z.string().min(1),
    grupo: z.string().min(1),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function POST(req: Request) {
    let rawBody;
    try {
        rawBody = await req.json();
    } catch (error) {
        console.error("[API Register] Invalid JSON body:", error);
        return NextResponse.json({ message: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
    }

    const validation = UserRegistrationSchema.safeParse(rawBody);

    if (!validation.success) {
        console.error("[API Register] Zod Validation Errors:", validation.error.flatten());
        return NextResponse.json({ 
            message: "Datos de entrada inválidos. Por favor, revisa los campos.", 
            errors: validation.error.flatten().fieldErrors 
        }, { status: 400 });
    }
    
    const data = validation.data;

    try {
        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", data.numeroIdentificacion));
        const existingUserSnapshot = await getDocs(q);

        if (!existingUserSnapshot.empty) {
            return NextResponse.json({ message: "Ya existe un usuario con este número de identificación." }, { status: 409 });
        }
        
        const newUserId = data.numeroIdentificacion;
        
        const usuarioData = {
          nombreCompleto: `${data.firstName} ${data.segundoNombre || ''} ${data.lastName} ${data.segundoApellido}`.replace(/\s+/g, ' ').trim(),
          nombre1: data.firstName,
          nombre2: data.segundoNombre || "",
          apellido1: data.lastName,
          apellido2: data.segundoApellido,
          tipoIdentificacion: data.tipoIdentificacion,
          identificacion: data.numeroIdentificacion,
          genero: data.gender,
          fechaNacimiento: Timestamp.fromDate(data.birthDate),
          telefono: data.phone,
          direccion: data.address,
          ciudad: data.city,
          pais: data.country,
          correo: data.correoPersonal,
          correoInstitucional: "", // To be generated upon approval
          rol: { id: "aspirante", descripcion: "Aspirante" },
          estado: "pendiente",
          fechaRegistro: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
          // We don't store the password in the user doc until they are approved
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
          estaInscrito: false, // Default to false
          fechaRegistro: serverTimestamp(),
          // Store password temporarily here until approval, or handle it securely otherwise
          // This is a simplification for the example. In production, use a more secure method.
          initialPassword: data.password,
        };
        
        const batch = writeBatch(db);
        
        const newUserDocRef = doc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"), newUserId);
        const newStudentDocRef = doc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes"), newUserId);

        batch.set(newUserDocRef, sanitizeForFirestore(usuarioData));
        batch.set(newStudentDocRef, sanitizeForFirestore(estudianteData));
        
        await batch.commit();
        
        return NextResponse.json({ 
            message: "Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud.", 
            userId: newUserId 
        }, { status: 201 });

    } catch (error: any) {
        console.error("[API Register] Firestore Write Error:", {
            code: error.code || 'UNKNOWN_SERVER_ERROR',
            message: error.message || 'Unknown error occurred.',
            stack: error.stack
        });
        
        return NextResponse.json({ 
            message: "Error interno del servidor. No se pudo completar el registro." 
        }, { status: 500 });
    }
}
