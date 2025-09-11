
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { sanitizeForFirestore } from "@/lib/firestore-utils";
import { validateEmail, validateIdNumber, validateName, validatePassword, validatePhoneNumber, validateRequired, validateSelection } from "@/lib/validators";

// Manual validation function for backend
const validateRegistrationData = (data: any) => {
    const errors: { [key: string]: string } = {};

    const nameValidation = validateName(data.firstName);
    if(nameValidation !== true) errors.firstName = nameValidation;

    const lastNameValidation = validateName(data.lastName);
    if(lastNameValidation !== true) errors.lastName = lastNameValidation;
    
    const idTypeValidation = validateSelection(data.tipoIdentificacion);
    if(idTypeValidation !== true) errors.tipoIdentificacion = idTypeValidation;

    const idNumberValidation = validateIdNumber(data.numeroIdentificacion);
    if(idNumberValidation !== true) errors.numeroIdentificacion = idNumberValidation;

    const genderValidation = validateSelection(data.gender);
    if(genderValidation !== true) errors.gender = genderValidation;

    const birthDateValidation = validateRequired(data.birthDate);
    if(birthDateValidation !== true) errors.birthDate = birthDateValidation;

    const phoneValidation = validatePhoneNumber(data.phone);
    if(phoneValidation !== true) errors.phone = phoneValidation;

    const addressValidation = validateRequired(data.address);
    if(addressValidation !== true) errors.address = addressValidation;

    const countryValidation = validateSelection(data.country);
    if(countryValidation !== true) errors.country = countryValidation;

    const cityValidation = validateSelection(data.city);
    if(cityValidation !== true) errors.city = cityValidation;

    const emailValidation = validateEmail(data.correoPersonal);
    if(emailValidation !== true) errors.correoPersonal = emailValidation;

    const sedeValidation = validateSelection(data.sedeId);
    if(sedeValidation !== true) errors.sedeId = sedeValidation;

    const carreraValidation = validateSelection(data.carreraId);
    if(carreraValidation !== true) errors.carreraId = carreraValidation;

    const grupoValidation = validateSelection(data.grupo);
    if(grupoValidation !== true) errors.grupo = grupoValidation;

    const passwordValidation = validatePassword(data.password);
    if(passwordValidation !== true) errors.password = passwordValidation;
    
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
          fechaNacimiento: Timestamp.fromDate(new Date(data.birthDate)), 
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
          sedeId: data.sedeId,
          carreraId: data.carreraId,
          grupo: data.grupo,
          correoInstitucional: "",
          cicloActual: null,
          materiasInscritas: [],
          estado: "pendiente",
          estaInscrito: false,
          fechaRegistro: serverTimestamp(),
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
