
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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

        return NextResponse.json({ id: userSnap.id, ...userSnap.data() }, { status: 200 });
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

        const body = await req.json();
        const { contrasena, rol, ...userData } = body;
        
        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);

        const dataToUpdate: any = {
            ...userData,
            nombreCompleto: `${body.nombre1} ${body.nombre2 || ''} ${body.apellido1} ${body.apellido2}`.replace(/\s+/g, ' ').trim(),
            rol: { id: rol, descripcion: rol.charAt(0).toUpperCase() + rol.slice(1) },
            fechaActualizacion: serverTimestamp(),
        };

        if (contrasena) {
            const saltRounds = 10;
            dataToUpdate.contrasena = await bcrypt.hash(contrasena, saltRounds);
        }

        await updateDoc(userRef, dataToUpdate);

        return NextResponse.json({ message: "Usuario actualizado correctamente." }, { status: 200 });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
