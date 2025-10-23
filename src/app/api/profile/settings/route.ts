
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { getAuth } from "firebase/auth"; // Assuming you might want to protect this

// Helper to get user ID, you might have a better way (e.g., from a session)
async function getUserIdFromRequest(req: Request) {
    // For now, let's assume userId is passed in header or body.
    // A more robust solution would use session management.
    const { searchParams } = new URL(req.url);
    return searchParams.get('userId');
}

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "No se proporcionó el ID de usuario." }, { status: 400 });
        }

        const prefsRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId, "config", "preferences");
        const docSnap = await getDoc(prefsRef);

        if (docSnap.exists()) {
            return NextResponse.json(docSnap.data(), { status: 200 });
        } else {
            return NextResponse.json({ message: "No se encontraron preferencias para este usuario." }, { status: 404 });
        }
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "No se proporcionó el ID de usuario." }, { status: 400 });
        }

        const body = await req.json();
        if (!body) {
            return NextResponse.json({ message: "No se proporcionaron datos de preferencias." }, { status: 400 });
        }
        
        const prefsRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId, "config", "preferences");
        await setDoc(prefsRef, body, { merge: true });

        return NextResponse.json({ message: "Preferencias guardadas exitosamente." }, { status: 200 });

    } catch (error) {
        console.error("Error saving user preferences:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
