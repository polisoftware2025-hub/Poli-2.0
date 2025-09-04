
import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from 'uuid';

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

    let finalImageUrl = imageUrl;

    // Check if the imageUrl is a base64 data URI
    if (imageUrl.startsWith('data:')) {
      const bucket = adminStorage.bucket();
      
      const mimeTypeMatch = imageUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        throw new Error("Invalid Data URI: MIME type not found.");
      }
      const mimeType = mimeTypeMatch[1];
      
      const base64EncodedImageString = imageUrl.split(';base64,').pop();
      if (!base64EncodedImageString) {
          throw new Error("Invalid Data URI: Base64 data not found.");
      }

      const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
      
      const fileExtension = mimeType.split('/')[1] || 'png';
      const fileName = `${collectionName}/${documentId}-${uuidv4()}.${fileExtension}`;
      const file = bucket.file(fileName);

      await file.save(imageBuffer, {
        metadata: { contentType: mimeType },
        public: true, 
      });

      finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }
    
    if (collectionName === 'carreras') {
        const docRef = adminDb.collection(`Politecnico/mzIX7rzezDezczAV6pQ7/carreras`).doc(documentId);
        await docRef.update({ imagenURL: finalImageUrl });
    } else if (collectionName === 'materias') {
        const careersRef = adminDb.collection(`Politecnico/mzIX7rzezDezczAV6pQ7/carreras`);
        const snapshot = await careersRef.get();
        
        let wasUpdated = false;
        const batch = adminDb.batch();

        for (const careerDoc of snapshot.docs) {
            const careerData = careerDoc.data();
            let needsUpdate = false;

            const updatedCiclos = (careerData.ciclos || []).map((ciclo: any) => {
                if (!ciclo.materias || !Array.isArray(ciclo.materias)) return ciclo;

                const updatedMaterias = (ciclo.materias).map((materia: any) => {
                    if (materia.id === documentId) {
                        needsUpdate = true;
                        wasUpdated = true;
                        return { ...materia, imagenURL: finalImageUrl };
                    }
                    return materia;
                });
                return { ...ciclo, materias: updatedMaterias };
            });

            if (needsUpdate) {
                batch.update(careerDoc.ref, { ciclos: updatedCiclos });
            }
        }
        
        if (!wasUpdated) {
            // It's not an error to not find the subject, it might just be in one career.
            // But if it's never found, we can let the user know.
            // For now, we will assume success if the process completes.
        }
        
        await batch.commit();
    }


    return NextResponse.json({ success: true, message: "Imagen actualizada correctamente.", newUrl: finalImageUrl });

  } catch (error) {
    console.error("Error updating image:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
