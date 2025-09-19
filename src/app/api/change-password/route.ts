
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correoInstitucional", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const storedPassword = userData.contrasena;
    
    if (!storedPassword) {
      return NextResponse.json({ message: "Esta cuenta no tiene una contraseña configurada para cambiar." }, { status: 400 });
    }

    // La comparación SIEMPRE debe ser con bcrypt, ya que todas las contraseñas nuevas y de seed se cifran.
    const isMatch = await bcrypt.compare(currentPassword, storedPassword);

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
