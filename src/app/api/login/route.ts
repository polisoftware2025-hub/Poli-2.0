
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validateEmail, validateRequired } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const emailValidation = validateEmail(body.email);
    if(emailValidation !== true) {
        return NextResponse.json({ message: emailValidation }, { status: 400 });
    }

    const passwordValidation = validateRequired(body.password);
    if(passwordValidation !== true) {
        return NextResponse.json({ message: "La contraseña es obligatoria." }, { status: 400 });
    }
    
    const { email, password } = body;

    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correoInstitucional", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Correo institucional no encontrado." }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (!userData.contrasena) {
      return NextResponse.json({ message: "La cuenta no tiene una contraseña configurada." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, userData.contrasena);

    if (!isMatch) {
      return NextResponse.json({ message: "Contraseña incorrecta." }, { status: 400 });
    }

    // No devolver la contraseña en la respuesta
    const { contrasena, ...user } = userData;
    const userId = userDoc.id;

    return NextResponse.json({ message: "Inicio de sesión exitoso.", user, userId }, { status: 200 });

  } catch (error) {
    console.error("Error en /api/login:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
