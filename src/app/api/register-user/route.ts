
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const nameValidation = z.string().min(2, "Debe tener al menos 2 caracteres").max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const lastNameValidation = z.string().min(2, "Debe tener al menos 2 caracteres").max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios.");
const cityCountryValidation = z.string().min(2);

const registerUserSchema = z.object({
    firstName: nameValidation,
    segundoNombre: z.string().max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/).optional().transform(e => e === "" ? undefined : e),
    lastName: lastNameValidation,
    segundoApellido: lastNameValidation,
    tipoIdentificacion: z.string(),
    numeroIdentificacion: z.string().min(1).max(15).refine(val => !/\s/.test(val)),
    gender: z.string(),
    birthDate: z.union([z.date(), z.string()]),
    phone: z.string().regex(/^\d{7,15}$/),
    address: z.string().min(5),
    country: cityCountryValidation,
    city: cityCountryValidation,
    correoPersonal: z.string().email(),
    program: z.string(),
    ciclo: z.string(),
    grupo: z.string(),
    jornada: z.string(),
    password: z.string().min(8),
    metodoPago: z.string(),
    selectedSubjects: z.array(z.object({
      id: z.string(),
      nombre: z.string(),
      codigo: z.string(),
      creditos: z.number(),
    })).optional(),
}).passthrough();

const tipoIdentificacionMap: { [key: string]: { id: string; descripcion: string } } = {
    'cc': { id: 'cc', descripcion: 'Cédula de Ciudadanía' },
    'ti': { id: 'ti', descripcion: 'Tarjeta de Identidad' },
    'ce': { id: 'ce', descripcion: 'Cédula de Extranjería' },
    'passport': { id: 'passport', descripcion: 'Pasaporte' },
};

async function emailExists(email: string): Promise<boolean> {
    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correoInstitucional", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

async function generateUniqueInstitutionalEmail(firstName: string, segundoNombre: string | undefined, lastName1: string, lastName2: string): Promise<string> {
    const domain = "@pi.edu.co";
    
    const nameParts = [
        firstName.toLowerCase().split(' ')[0],
        segundoNombre ? segundoNombre.toLowerCase().split(' ')[0] : '',
        lastName1.toLowerCase().split(' ')[0],
        lastName2.toLowerCase().split(' ')[0]
    ].filter(Boolean); 

    const baseEmail = nameParts.slice(0, 3).join('.');
    
    let finalEmail = `${baseEmail}${domain}`;
    let counter = 1;

    while (await emailExists(finalEmail)) {
        finalEmail = `${baseEmail}${counter}${domain}`;
        counter++;
    }

    return finalEmail;
}


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = registerUserSchema.safeParse(body);

        if (!validation.success) {
            console.error("Errores de validación:", validation.error.format());
            return NextResponse.json({ message: "Datos de entrada inválidos. Por favor, revise todos los campos.", error: validation.error.format() }, { status: 400 });
        }
        
        const { data } = validation;

        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", data.numeroIdentificacion));
        const existingUserSnapshot = await getDocs(q);

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const politecnicoDocRef = doc(db, "Politecnico", "mzIX7rzezDezczAV6pQ7");
        const batch = writeBatch(db);
        let userDocRef;
        let correoInstitucional;

        if (existingUserSnapshot.empty) {
            // Crear nuevo usuario
            userDocRef = doc(usuariosRef);
            correoInstitucional = await generateUniqueInstitutionalEmail(data.firstName, data.segundoNombre, data.lastName, data.segundoApellido);

            const usuarioData = {
              nombre1: data.firstName,
              nombre2: data.segundoNombre || "",
              apellido1: data.lastName,
              apellido2: data.segundoApellido,
              tipoIdentificacion: tipoIdentificacionMap[data.tipoIdentificacion],
              identificacion: data.numeroIdentificacion,
              genero: data.gender,
              fechaNacimiento: new Date(data.birthDate),
              telefono: data.phone,
              direccion: data.address,
              ciudad: data.city,
              pais: data.country,
              correo: data.correoPersonal,
              correoInstitucional: correoInstitucional,
              contrasena: hashedPassword,
              rol: { id: "estudiante", descripcion: "Estudiante" },
              estaInscrito: true,
              fechaCreacion: serverTimestamp(),
              fechaActualizacion: serverTimestamp()
            };
            batch.set(userDocRef, usuarioData);
            
            const estudianteRef = doc(collection(politecnicoDocRef, "estudiantes"), userDocRef.id);
            const estudianteData = {
              usuarioId: userDocRef.id,
              carreraId: data.program,
              cicloActual: parseInt(data.ciclo, 10),
              grupo: data.grupo,
              jornada: data.jornada,
              materiasInscritas: data.selectedSubjects || [],
              estado: 'activo',
              fechaCreacion: serverTimestamp(),
              fechaActualizacion: serverTimestamp()
            };
            batch.set(estudianteRef, estudianteData);

        } else {
            // Actualizar usuario existente
            userDocRef = existingUserSnapshot.docs[0].ref;
            correoInstitucional = existingUserSnapshot.docs[0].data().correoInstitucional;

             const usuarioUpdateData = {
              nombre1: data.firstName,
              nombre2: data.segundoNombre || "",
              apellido1: data.lastName,
              apellido2: data.segundoApellido,
              tipoIdentificacion: tipoIdentificacionMap[data.tipoIdentificacion],
              genero: data.gender,
              fechaNacimiento: new Date(data.birthDate),
              telefono: data.phone,
              direccion: data.address,
              ciudad: data.city,
              pais: data.country,
              correo: data.correoPersonal,
              contrasena: hashedPassword,
              estaInscrito: true,
              fechaActualizacion: serverTimestamp()
            };
            batch.update(userDocRef, usuarioUpdateData);

            const estudianteRef = doc(collection(politecnicoDocRef, "estudiantes"), userDocRef.id);
            const estudianteUpdateData = {
              carreraId: data.program,
              cicloActual: parseInt(data.ciclo, 10),
              grupo: data.grupo,
              jornada: data.jornada,
              materiasInscritas: data.selectedSubjects || [],
              estado: 'activo',
              fechaActualizacion: serverTimestamp()
            };
            batch.update(estudianteRef, estudianteUpdateData);
        }

        await batch.commit();
        
        const message = existingUserSnapshot.empty ? "Usuario registrado exitosamente." : "Usuario actualizado exitosamente.";
        return NextResponse.json({ message, correoInstitucional }, { status: 201 });

    } catch (error) {
        console.error("Error en /api/register-user:", error);
        return NextResponse.json({ message: "Error interno del servidor. No se pudo completar el registro." }, { status: 500 });
    }
}
