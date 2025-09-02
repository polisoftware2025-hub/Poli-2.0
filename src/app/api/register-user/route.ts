
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

// Manual validation function instead of Zod
const validateRegistrationData = (data: any) => {
    const errors: { [key: string]: string } = {};

    if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length < 1) errors.firstName = "El primer nombre es requerido.";
    if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length < 1) errors.lastName = "El primer apellido es requerido.";
    if (!data.segundoApellido || typeof data.segundoApellido !== 'string' || data.segundoApellido.trim().length < 1) errors.segundoApellido = "El segundo apellido es requerido.";
    if (!data.tipoIdentificacion) errors.tipoIdentificacion = "El tipo de identificación es requerido.";
    if (!data.numeroIdentificacion || typeof data.numeroIdentificacion !== 'string' || data.numeroIdentificacion.trim().length < 5) errors.numeroIdentificacion = "El número de identificación es requerido.";
    if (!data.gender) errors.gender = "El género es requerido.";
    if (!data.birthDate) errors.birthDate = "La fecha de nacimiento es requerida.";
    if (!data.phone || !/^\d{7,15}$/.test(data.phone)) errors.phone = "El teléfono no es válido.";
    if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 5) errors.address = "La dirección es requerida.";
    if (!data.country) errors.country = "El país es requerido.";
    if (!data.city) errors.city = "La ciudad es requerida.";
    if (!data.correoPersonal || !/\S+@\S+\.\S+/.test(data.correoPersonal)) errors.correoPersonal = "El correo personal no es válido.";
    if (!data.carreraId) errors.carreraId = "La carrera es requerida.";
    if (!data.modalidad) errors.modalidad = "La modalidad es requerida.";
    if (!data.grupo) errors.grupo = "El grupo es requerido.";
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
    
    if (Object.keys(errors).length > 0) {
        return { isValid: false, errors };
    }
    
    return { isValid: true, errors: null };
};


export async function POST(req: Request) {
    let rawBody;
    try {
        rawBody = await req.json();
    } catch (error) {
        console.error("[API Register] Invalid JSON body:", error);
        return NextResponse.json({ message: "El cuerpo de la solicitud no es un JSON válido." }, { status: 400 });
    }

    // Remove metodoPago from validation, as it's no longer part of the form
    const { metodoPago, ...dataToValidate } = rawBody;
    const { isValid, errors } = validateRegistrationData(dataToValidate);

    if (!isValid) {
        console.error("[API Register] Manual Validation Errors:", errors);
        return NextResponse.json({ 
            message: "Datos de entrada inválidos. Por favor, revisa los campos.", 
            errors
        }, { status: 400 });
    }
    
    const data = dataToValidate;

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
          fechaNacimiento: Timestamp.fromDate(new Date(data.birthDate)), // Convert string to Date, then to Timestamp
          telefono: data.phone,
          direccion: data.address,
          ciudad: data.city,
          pais: data.country,
          correo: data.correoPersonal,
          correoInstitucional: "",
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
          estaInscrito: false,
          fechaRegistro: serverTimestamp(),
          initialPassword: data.password, // Keep initial password for activation
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
