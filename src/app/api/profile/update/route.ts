
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, ...updateData } = body;

        if (!userId) {
            return NextResponse.json({ message: "ID de usuario no proporcionado." }, { status: 400 });
        }
        
        const dataToUpdate: { [key: string]: any } = {
            ...updateData,
            nombreCompleto: `${updateData.nombre1 || ''} ${updateData.nombre2 || ''} ${updateData.apellido1 || ''} ${updateData.apellido2 || ''}`.replace(/\s+/g, ' ').trim(),
            fechaActualizacion: serverTimestamp(),
        };

        const userRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId);
        
        await updateDoc(userRef, dataToUpdate);

        return NextResponse.json({ message: "Perfil actualizado correctamente." }, { status: 200 });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
