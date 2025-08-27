
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Datos inválidos.", error: validation.error.format() }, { status: 400 });
    }
    
    const { email, password } = validation.data;

    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correoInstitucional", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Correo institucional no encontrado." }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    const isMatch = await bcrypt.compare(password, userData.contrasena);

    if (!isMatch) {
      return NextResponse.json({ message: "Contraseña incorrecta." }, { status: 400 });
    }

    // No devolver la contraseña en la respuesta
    const { contrasena, ...user } = userData;

    return NextResponse.json({ message: "Inicio de sesión exitoso.", user }, { status: 200 });

  } catch (error) {
    console.error("Error en /api/login:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
