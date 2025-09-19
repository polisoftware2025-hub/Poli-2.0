
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, telefono, direccion } = body;

        if (!userId) {
            return NextResponse.json({ message: "ID de usuario no proporcionado." }, { status: 400 });
        }
        
        if (!telefono && !direccion) {
             return NextResponse.json({ message: "No hay datos para actualizar." }, { status: 400 });
        }

        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        
        const dataToUpdate: { [key: string]: any } = {
            fechaActualizacion: serverTimestamp(),
        };

        if (telefono) dataToUpdate.telefono = telefono;
        if (direccion) dataToUpdate.direccion = direccion;

        await updateDoc(userRef, dataToUpdate);

        return NextResponse.json({ message: "Perfil actualizado correctamente." }, { status: 200 });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
