
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  // IMPORTANT: In a real-world application, you MUST add authentication
  // and authorization checks here to ensure only admin users can perform this action.
  
  try {
    const { collectionName, documentId, imageUrl } = await req.json();

    if (!collectionName || !documentId || !imageUrl) {
      return NextResponse.json({ message: "Datos incompletos." }, { status: 400 });
    }
    
    if (collectionName !== 'carreras' && collectionName !== 'materias') {
        return NextResponse.json({ message: "Colección no válida." }, { status: 400 });
    }
    
    if (collectionName === 'carreras') {
        const docRef = adminDb.collection(`Politecnico/mzIX7rzezDezczAV6pQ7/carreras`).doc(documentId);
        await docRef.update({ imagenURL: imageUrl });
    } else if (collectionName === 'materias') {
        const careersRef = adminDb.collection(`Politecnico/mzIX7rzezDezczAV6pQ7/carreras`);
        const snapshot = await careersRef.get();
        
        const batch = adminDb.batch();
        let updateFound = false;

        for (const careerDoc of snapshot.docs) {
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
        }
        
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
