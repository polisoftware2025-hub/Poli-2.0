
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
    const storedPassword = userData.contrasena;

    let isMatch = false;

    // Intentar comparar con bcrypt si hay una contraseña almacenada.
    if (storedPassword) {
      try {
        isMatch = await bcrypt.compare(currentPassword, storedPassword);
      } catch (error) {
        // Si bcrypt falla (ej. el hash es inválido o no es un hash), lo ignoramos y procedemos a la comparación de texto plano.
        console.warn("Bcrypt compare falló, probablemente no es un hash válido. Se intentará comparación de texto plano.", error);
        isMatch = false;
      }
    }

    // Si la comparación con bcrypt falla o no hay contraseña, intentar como texto plano.
    // Esto es para la simulación donde la contraseña inicial no está encriptada.
    if (!isMatch && currentPassword === storedPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ message: "La contraseña actual es incorrecta." }, { status: 400 });
    }
    
    // Si la contraseña actual es correcta, procedemos a actualizar.

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
