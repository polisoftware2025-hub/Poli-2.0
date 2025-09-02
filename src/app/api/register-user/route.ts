
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, writeBatch, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const nameValidation = z.string().min(2, "Debe tener al menos 2 caracteres").max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const lastNameValidation = z.string().min(2, "Debe tener al menos 2 caracteres").max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const cityCountryValidation = z.string().min(2);

const preRegisterUserSchema = z.object({
    firstName: nameValidation,
    segundoNombre: z.string().max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/).optional().transform(e => e === "" ? undefined : e),
    lastName: lastNameValidation,
    segundoApellido: lastNameValidation,
    tipoIdentificacion: z.string(),
    numeroIdentificacion: z.string().min(1).max(15).refine(val => !/\s/.test(val)),
    gender: z.string(),
    birthDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
    phone: z.string().regex(/^\d{7,15}$/),
    address: z.string().min(5),
    country: cityCountryValidation,
    city: cityCountryValidation,
    correoPersonal: z.string().email(),
    program: z.string(),
    modalidad: z.string(),
    grupo: z.string(),
    password: z.string().min(8),
}).passthrough();

const tipoIdentificacionMap: { [key: string]: { id: string; descripcion: string } } = {
    'cc': { id: 'cc', descripcion: 'Cédula de Ciudadanía' },
    'ti': { id: 'ti', descripcion: 'Tarjeta de Identidad' },
    'ce': { id: 'ce', descripcion: 'Cédula de Extranjería' },
    'passport': { id: 'passport', descripcion: 'Pasaporte' },
};

async function generateUniqueInstitutionalEmail(firstName: string, lastName: string, segundoApellido: string): Promise<string> {
    const domain = "@pi.edu.co";
    const baseEmail = [
        firstName.toLowerCase().split(' ')[0],
        lastName.toLowerCase().split(' ')[0],
        segundoApellido.toLowerCase().split(' ')[0]
    ].join('.');
    
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


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = preRegisterUserSchema.safeParse(body);

        if (!validation.success) {
            console.error("Errores de validación:", validation.error.format());
            return NextResponse.json({ message: "Datos de entrada inválidos. Por favor, revise todos los campos.", error: validation.error.format() }, { status: 400 });
        }
        
        const { data } = validation;

        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", data.numeroIdentificacion));
        const existingUserSnapshot = await getDocs(q);

        if (!existingUserSnapshot.empty) {
            // User exists, update their data
            const userDocRef = existingUserSnapshot.docs[0].ref;
            const studentDocRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userDocRef.id);
            
            const batch = writeBatch(db);

            const usuarioUpdateData = {
                // Fields to update go here, for now, we'll just set the status to pending
                estado: "pendiente",
                fechaActualizacion: serverTimestamp()
            };
            batch.update(userDocRef, usuarioUpdateData);

            const estudianteUpdateData = {
                 estado: "pendiente",
                 // update other fields if necessary
            };
            batch.update(studentDocRef, estudianteUpdateData);

            await batch.commit();

            return NextResponse.json({ message: "Tu solicitud de reinscripción ha sido enviada exitosamente. Un administrador la revisará.", userId: userDocRef.id }, { status: 200 });
        }
        
        // New user, create documents
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const politecnicoDocRef = doc(db, "Politecnico", "mzIX7rzezDezczAV6pQ7");
        const newUserDocRef = doc(usuariosRef);
        
        const institutionalEmail = await generateUniqueInstitutionalEmail(data.firstName, data.lastName, data.segundoApellido);

        const usuarioData = {
          nombreCompleto: `${data.firstName} ${data.segundoNombre || ''} ${data.lastName} ${data.segundoApellido}`.replace(/\s+/g, ' ').trim(),
          nombre1: data.firstName,
          nombre2: data.segundoNombre || "",
          apellido1: data.lastName,
          apellido2: data.segundoApellido,
          tipoIdentificacion: tipoIdentificacionMap[data.tipoIdentificacion],
          identificacion: data.numeroIdentificacion,
          genero: data.gender,
          fechaNacimiento: data.birthDate,
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
        
        await setDoc(newUserDocRef, usuarioData);

        const estudianteRef = doc(collection(politecnicoDocRef, "estudiantes"), newUserDocRef.id);
        const estudianteData = {
          usuarioId: newUserDocRef.id,
          nombreCompleto: usuarioData.nombreCompleto,
          documento: data.numeroIdentificacion,
          carrera: data.program,
          modalidad: data.modalidad,
          grupo: data.grupo,
          correoInstitucional: "", // Initially empty, filled on approval
          cicloActual: null, // Initially null, set on approval
          materiasInscritas: [],
          estado: "activo", // Set to 'activo' as per requirement
          fechaRegistro: serverTimestamp()
        };
        await setDoc(estudianteRef, estudianteData);
        
        const message = "Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud.";
        return NextResponse.json({ message, userId: newUserDocRef.id }, { status: 201 });

    } catch (error) {
        console.error("Error en /api/register-user:", error);
        return NextResponse.json({ message: "Error interno del servidor. No se pudo completar el registro." }, { status: 500 });
    }
}
