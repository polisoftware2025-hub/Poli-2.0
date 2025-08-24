
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial."),
});

export async function POST(req: Request) {
    try {
        const { token, password, confirmPassword } = await req.json();

        if (!token || !password || !confirmPassword) {
            return NextResponse.json({ message: "Token y contraseñas son requeridos." }, { status: 400 });
        }
        
        if (password !== confirmPassword) {
             return NextResponse.json({ message: "Las contraseñas no coinciden." }, { status: 400 });
        }
        
        const passwordValidation = passwordSchema.safeParse({ password });
        if (!passwordValidation.success) {
            const firstError = passwordValidation.error.errors[0].message;
            return NextResponse.json({ message: `La contraseña no cumple con los requisitos: ${firstError}` }, { status: 400 });
        }
        
        const tokensRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/tokens");
        const q = query(tokensRef, where("token", "==", token));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: "El enlace de recuperación no es válido o ha expirado." }, { status: 400 });
        }

        const tokenDoc = querySnapshot.docs[0];
        const tokenData = tokenDoc.data();
        
        if (tokenData.usado) {
             return NextResponse.json({ message: "Este enlace de recuperación ya ha sido utilizado." }, { status: 400 });
        }

        const now = new Date();
        const expirationDate = tokenData.fechaExpiracion.toDate();

        if (now > expirationDate) {
            return NextResponse.json({ message: "El enlace de recuperación ha expirado. Por favor, solicita uno nuevo." }, { status: 400 });
        }
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userDocRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", tokenData.usuarioId);
        await updateDoc(userDocRef, {
            contrasena: hashedPassword
        });

        await updateDoc(tokenDoc.ref, {
            usado: true
        });

        return NextResponse.json({ message: "Contraseña actualizada exitosamente." }, { status: 200 });

    } catch (error) {
        console.error("Error en /reset-password:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
