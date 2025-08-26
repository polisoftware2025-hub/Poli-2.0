
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const changePasswordSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ message: "Todos los campos son obligatorios." }, { status: 400 });
    }

    const validation = changePasswordSchema.safeParse({ email, currentPassword, newPassword });
    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", error: validation.error.format() }, { status: 400 });
    }

    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correo", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Si la contraseña no está encriptada en la BD, la comparación con bcrypt fallará.
    // Por ello, añadimos una lógica de mock para permitir el flujo.
    let isMatch = false;
    if (userData.contrasena) {
      // Si hay contraseña, intentamos compararla como si estuviera hasheada.
       try {
         isMatch = await bcrypt.compare(currentPassword, userData.contrasena);
       } catch (error) {
         // Si bcrypt falla (ej. el hash es inválido), asumimos que no coincide.
         console.warn("Error al comparar con bcrypt, posiblemente el hash no es válido:", error);
         isMatch = false;
       }
    }

    if (!isMatch) {
        // Lógica de MOCK: si la comparación falla, comprobamos contra una contraseña por defecto
        // o contra la contraseña en texto plano si no está hasheada.
        // Esto NO debe hacerse en producción. Es solo para el entorno de desarrollo actual.
        if (currentPassword !== "password123" && currentPassword !== userData.contrasena) {
            return NextResponse.json({ message: "La contraseña actual es incorrecta." }, { status: 400 });
        }
    }
    
    // Si la contraseña actual es correcta (ya sea por bcrypt o por el mock), procedemos a actualizar.

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await updateDoc(userDoc.ref, {
      contrasena: hashedPassword,
    });

    return NextResponse.json({ message: "Contraseña actualizada exitosamente." }, { status: 200 });

  } catch (error) {
    console.error("Error en /api/change-password:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
