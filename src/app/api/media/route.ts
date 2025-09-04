
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, writeBatch, updateDoc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { collectionName, documentId, imageUrl } = await req.json();

    if (!collectionName || !documentId || !imageUrl) {
      return NextResponse.json({ message: "Datos incompletos." }, { status: 400 });
    }
    
    if (collectionName !== 'carreras' && collectionName !== 'materias' && collectionName !== 'siteSettings') {
        return NextResponse.json({ message: "Colección no válida." }, { status: 400 });
    }
    
    if (collectionName === 'carreras') {
        const docRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras", documentId);
        await updateDoc(docRef, { imagenURL: imageUrl });
    } else if (collectionName === 'siteSettings') {
        const docRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/siteSettings", documentId);
        await setDoc(docRef, { imageUrl: imageUrl }, { merge: true });
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
