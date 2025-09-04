
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  // IMPORTANT: In a real-world application, you MUST add authentication
  // and authorization checks here to ensure only admin users can perform this action.
  // For example, by verifying a Firebase Auth ID token or a session cookie.
  
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
        // Since subjects are nested, this is more complex. We need to find the career
        // that contains this subject and update it.
        // This is a simplified example. A more robust solution might involve a
        // separate top-level 'materias' collection or a more complex update logic.
        const careersRef = adminDb.collection(`Politecnico/mzIX7rzezDezczAV6pQ7/carreras`);
        const snapshot = await careersRef.get();
        
        let updated = false;

        for (const careerDoc of snapshot.docs) {
            const careerData = careerDoc.data();
            let ciclos = careerData.ciclos || [];
            let needsUpdate = false;

            ciclos = ciclos.map((ciclo: any) => {
                const materias = ciclo.materias.map((materia: any) => {
                    if (materia.id === documentId) {
                        needsUpdate = true;
                        return { ...materia, imagenURL: imageUrl };
                    }
                    return materia;
                });
                return { ...ciclo, materias };
            });

            if (needsUpdate) {
                await careerDoc.ref.update({ ciclos });
                updated = true;
                break; 
            }
        }
        
        if (!updated) {
            return NextResponse.json({ message: "Materia no encontrada en ninguna carrera." }, { status: 404 });
        }
    }


    return NextResponse.json({ success: true, message: "Imagen actualizada correctamente." });

  } catch (error) {
    console.error("Error updating image:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
