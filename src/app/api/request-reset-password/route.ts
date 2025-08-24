
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { transporter, mailOptions } from "@/lib/nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "El correo electrónico es obligatorio." }, { status: 400 });
    }

    const usuariosRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios");
    const q = query(usuariosRef, where("correo", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "El correo no está registrado." }, { status: 400 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userName = userDoc.data().nombre1 || "usuario";
    
    const token = uuidv4();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const tokensRef = collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/tokens");
    await addDoc(tokensRef, {
      usuarioId: userId,
      token: token,
      fechaCreacion: serverTimestamp(),
      fechaExpiracion: expirationDate,
      usado: false,
    });
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    try {
        await transporter.sendMail({
            ...mailOptions,
            to: email,
            subject: "Restablecimiento de contraseña",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h3>Hola ${userName},</h3>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para continuar:</p>
                <p style="text-align: center;">
                  <a href="${resetLink}" style="background-color: #004aad; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                </p>
                <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>El enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, por favor ignora este mensaje.</p>
                <br>
                <p>Atentamente,</p>
                <p><strong>El equipo de Poli 2.0</strong></p>
              </div>
            `,
        });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        return NextResponse.json({ message: "Error al enviar el correo de recuperación." }, { status: 500 });
    }

    return NextResponse.json({ message: "Se ha enviado un enlace de recuperación a tu correo." }, { status: 200 });

  } catch (error) {
    console.error("Error en /request-reset-password:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
