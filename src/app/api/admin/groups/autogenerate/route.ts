
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, writeBatch, serverTimestamp, doc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { carreraId } = await req.json();

        if (!carreraId) {
            return NextResponse.json({ message: "El ID de la carrera es obligatorio." }, { status: 400 });
        }

        const sedesRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/sedes");
        const gruposRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/grupos");

        const sedesSnapshot = await getDocs(sedesRef);
        if (sedesSnapshot.empty) {
            return NextResponse.json({ message: "No se encontraron sedes para crear grupos." }, { status: 404 });
        }

        const batch = writeBatch(db);
        let createdCount = 0;

        for (const sedeDoc of sedesSnapshot.docs) {
            const sede = { id: sedeDoc.id, ...sedeDoc.data() };

            const q = query(
                gruposRef,
                where("idSede", "==", sede.id),
                where("idCarrera", "==", carreraId)
            );
            
            const existingGroupsSnapshot = await getDocs(q);
            const nextGroupNumber = existingGroupsSnapshot.size + 1;
            const newCodigoGrupo = `${sede.nombre} - Grupo ${nextGroupNumber}`;
            
            const newGroupDocRef = doc(gruposRef);
            batch.set(newGroupDocRef, {
                codigoGrupo: newCodigoGrupo,
                idSede: sede.id,
                idCarrera: carreraId,
                ciclo: 1, // Default to cycle 1
                estado: "activo",
                fechaCreacion: serverTimestamp(),
                estudiantes: [],
                horario: []
            });
            createdCount++;
        }

        await batch.commit();

        return NextResponse.json({ 
            message: `Se han creado ${createdCount} grupos exitosamente.`,
            count: createdCount 
        }, { status: 201 });

    } catch (error) {
        console.error("Error en autogenerate/route.ts:", error);
        const message = error instanceof Error ? error.message : "Error interno del servidor.";
        return NextResponse.json({ message }, { status: 500 });
    }
}
