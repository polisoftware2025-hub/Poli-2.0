
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const nameValidation = z.string().min(2).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/);
const lastNameValidation = z.string().min(2).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/);
const cityCountryValidation = z.string().min(2);

const registerUserSchema = z.object({
    firstName: nameValidation,
    segundoNombre: z.string().min(2).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).optional().or(z.literal('')),
    lastName: lastNameValidation,
    segundoApellido: lastNameValidation,
    tipoIdentificacion: z.string(),
    numeroIdentificacion: z.string().min(1).max(15).refine(val => !/\s/.test(val)),
    gender: z.string(),
    birthDate: z.string(), // Dates will be passed as strings
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
});

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

async function generateUniqueInstitutionalEmail(firstName: string, lastName1: string, lastName2: string): Promise<string> {
    const domain = "@pi.edu.co";
    const baseEmail = `${firstName.toLowerCase().split(' ')[0]}.${lastName1.toLowerCase().split(' ')[0]}.${lastName2.toLowerCase().split(' ')[0]}`;
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
            return NextResponse.json({ message: "Datos de entrada inválidos.", error: validation.error.format() }, { status: 400 });
        }
        
        const { data } = validation;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        const politecnicoDocRef = doc(db, "Politecnico", "mzIX7rzezDezczAV6pQ7");
        const usuariosCollectionRef = collection(politecnicoDocRef, "usuarios");
        const newUserDocRef = doc(usuariosCollectionRef);

        const correoInstitucional = await generateUniqueInstitutionalEmail(data.firstName, data.lastName, data.segundoApellido);

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
        };
        
        await setDoc(newUserDocRef, usuarioData);
        
        const estudiantesCollectionRef = collection(politecnicoDocRef, "estudiantes");
        const estudianteDocRef = doc(estudiantesCollectionRef, newUserDocRef.id);
        
        const estudianteData = {
          usuarioId: newUserDocRef.id,
          carreraId: data.program,
          cicloActual: parseInt(data.ciclo, 10),
          grupo: data.grupo,
          jornada: data.jornada,
          estado: 'activo',
          fechaCreacion: serverTimestamp(),
        };

        await setDoc(estudianteDocRef, estudianteData);
        
        return NextResponse.json({ message: "Usuario registrado exitosamente." }, { status: 201 });

    } catch (error) {
        console.error("Error en /api/register-user:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
