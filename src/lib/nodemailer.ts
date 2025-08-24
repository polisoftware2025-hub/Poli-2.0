
import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  throw new Error("Las credenciales de correo no están definidas en las variables de entorno.");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export const mailOptions = {
    from: `"Soporte Poli 2.0" <${emailUser}>`,
};
