
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, writeBatch, serverTimestamp, doc } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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
    
    // Normalize email by removing accents and special characters
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

    let baseEmail = [normalize(namePart), normalize(lastName1Part), normalize(lastName2Part)].filter(Boolean).join('.');
    
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
        
        const { identificacion, contrasena, rol, sedeId, carreraId, grupo, ...rest } = body;

        // Security Rule: Prevent creating admin/rector from generic user creation panel
        if (rol === 'admin' || rol === 'rector') {
            return NextResponse.json({ message: "No está permitido crear usuarios de alto nivel desde este panel." }, { status: 403 });
        }

        const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
        const q = query(usuariosRef, where("identificacion", "==", identificacion));
        const existingUserSnapshot = await getDocs(q);

        if (!existingUserSnapshot.empty) {
            return NextResponse.json({ message: "Ya existe un usuario con este número de identificación." }, { status: 409 });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

        const institutionalEmail = await generateUniqueInstitutionalEmail(body.nombre1, body.apellido1, body.nombre2);
        
        const nombreCompleto = `${body.nombre1} ${body.nombre2 || ''} ${body.apellido1} ${body.apellido2}`.replace(/\s+/g, ' ').trim();

        const batch = writeBatch(db);
        const newUserRef = doc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios"));
        
        const newUserDoc = {
            ...rest,
            identificacion,
            nombreCompleto,
            correoInstitucional: institutionalEmail,
            rol: { id: rol, descripcion: rol.charAt(0).toUpperCase() + rol.slice(1) },
            contrasena: hashedPassword,
            estado: "activo",
            fechaRegistro: serverTimestamp(),
            fechaActualizacion: serverTimestamp(),
        };

        batch.set(newUserRef, newUserDoc);

        if (rol === 'estudiante') {
            const studentData = {
                usuarioId: newUserRef.id,
                nombreCompleto: nombreCompleto,
                documento: identificacion,
                sedeId: sedeId,
                carreraId: carreraId,
                grupo: grupo,
                correoInstitucional: institutionalEmail,
                cicloActual: 1, 
                materiasInscritas: [],
                estado: "aprobado", 
                estaInscrito: true,
                fechaRegistro: serverTimestamp(),
            };
            const newStudentRef = doc(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes"), newUserRef.id);
            batch.set(newStudentRef, studentData);
        }
        
        await batch.commit();

        return NextResponse.json({ ...newUserDoc, id: newUserRef.id }, { status: 201 });

    } catch (error) {
        console.error("Error al crear usuario:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
