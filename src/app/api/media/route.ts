
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

// This endpoint is simplified to not use Firebase Admin SDK or Storage directly.
// It takes a URL (which can be an http/https URL or a base64 data URI)
// and saves it directly to the imagenURL field in Firestore.
// WARNING: In a real-world application, you MUST add authentication
// and authorization checks here to ensure only admin users can perform this action.

export async function POST(req: Request) {
  try {
    const { collectionName, documentId, imageUrl } = await req.json();

    if (!collectionName || !documentId || !imageUrl) {
      return NextResponse.json({ message: "Datos incompletos." }, { status: 400 });
    }
    
    if (collectionName !== 'carreras' && collectionName !== 'materias') {
        return NextResponse.json({ message: "Colección no válida." }, { status: 400 });
    }
    
    if (collectionName === 'carreras') {
        const docRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", documentId);
        await writeBatch(db).update(docRef, { imagenURL: imageUrl }).commit();
    } else if (collectionName === 'materias') {
        const careersRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras");
        const snapshot = await getDocs(careersRef);
        
        const batch = writeBatch(db);
        let updateFound = false;

        snapshot.forEach(careerDoc => {
            const careerData = careerDoc.data();
            let needsUpdate = false;

            const updatedCiclos = (careerData.ciclos || []).map((ciclo: any) => {
                if (!ciclo.materias || !Array.isArray(ciclo.materias)) return ciclo;

                const updatedMaterias = (ciclo.materias).map((materia: any) => {
                    if (materia.id === documentId) {
                        needsUpdate = true;
                        updateFound = true;
                        return { ...materia, imagenURL: imageUrl };
                    }
                    return materia;
                });
                return { ...ciclo, materias: updatedMaterias };
            });

            if (needsUpdate) {
                batch.update(careerDoc.ref, { ciclos: updatedCiclos });
            }
        });
        
        if (!updateFound) {
            return NextResponse.json({ success: false, message: "Materia no encontrada en ninguna carrera." }, { status: 404 });
        }
        
        await batch.commit();
    }

    return NextResponse.json({ success: true, message: "Imagen actualizada correctamente.", newUrl: imageUrl });

  } catch (error) {
    console.error("Error updating image:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
