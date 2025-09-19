
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ message: "ID de usuario no proporcionado." }, { status: 400 });
        }

        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
        }
        
        const userData = userSnap.data();
        
        // Si es estudiante, buscar sus datos académicos
        if (userData.rol.id === 'estudiante') {
            const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
            const studentSnap = await getDoc(studentRef);
            if(studentSnap.exists()){
                const studentData = studentSnap.data();
                return NextResponse.json({ id: userSnap.id, ...userData, ...studentData }, { status: 200 });
            }
        }

        return NextResponse.json({ id: userSnap.id, ...userData }, { status: 200 });

    } catch (error) {
        console.error("Error al obtener usuario:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ message: "ID de usuario no proporcionado." }, { status: 400 });
        }
        
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ message: "Usuario no encontrado para actualizar." }, { status: 404 });
        }
        
        const body = await req.json();
        const { contrasena, rol, sedeId, carreraId, grupo, ...userData } = body;
        
        const batch = writeBatch(db);
        
        const dataToUpdate: any = {
            ...userData,
            nombreCompleto: `${body.nombre1} ${body.nombre2 || ''} ${body.apellido1} ${body.apellido2}`.replace(/\s+/g, ' ').trim(),
            fechaActualizacion: serverTimestamp(),
        };

        // Only update role if it's provided and different
        const existingData = userSnap.data();
        if (rol && existingData.rol.id !== rol) {
            dataToUpdate.rol = { id: rol, descripcion: rol.charAt(0).toUpperCase() + rol.slice(1) };
        }

        batch.update(userRef, dataToUpdate);
        
        if(rol === 'estudiante'){
             const studentRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/estudiantes", userId);
             const studentDataToUpdate = {
                 sedeId,
                 carreraId,
                 grupo,
                 fechaActualizacion: serverTimestamp(),
             };
             batch.update(studentRef, studentDataToUpdate);
        }

        await batch.commit();

        return NextResponse.json({ message: "Usuario actualizado correctamente." }, { status: 200 });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
