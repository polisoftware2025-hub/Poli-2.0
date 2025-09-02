
'use server';
/**
 * @fileOverview A Genkit flow to generate and "send" a welcome email with credentials.
 *
 * - sendWelcomeEmail - A function that generates and sends an HTML email with login details.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { transporter, mailOptions } from "@/lib/nodemailer";

const SendWelcomeEmailInputSchema = z.object({
  email: z.string().email().describe('The recipient\'s personal email address.'),
  name: z.string().describe('The name of the recipient.'),
  institutionalEmail: z.string().email().describe('The newly generated institutional email.'),
  temporaryPassword: z.string().describe('The temporary password for the first login.'),
});

export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<{ success: boolean, message: string }> {
    const welcomeEmailPrompt = ai.definePrompt({
        name: 'welcomeEmailPrompt',
        input: { schema: SendWelcomeEmailInputSchema },
        output: { format: 'text' },
        prompt: `
            Generate a professional and welcoming HTML email for a newly enrolled student.

            The email should be addressed to {{{name}}}.
            It must contain their new institutional email: {{{institutionalEmail}}}
            It must contain their temporary password: {{{temporaryPassword}}}

            The email should have the following structure and style:
            - Use a header with the "Poli 2.0" logo (URL: https://placehold.co/150x50/002147/FFFFFF?text=Poli+2.0).
            - A welcoming title like "¡Bienvenido a Poli 2.0!".
            - A clear message congratulating them on their successful enrollment.
            - Clearly state their login credentials (institutional email and temporary password).
            - Strongly advise the student to log in and change their temporary password immediately for security.
            - Include a call-to-action button linking to the login page.
            - Use inline CSS for styling to ensure maximum compatibility.
            - The color palette should be based on the institutional colors: dark blue (#002147) and accents.

            Return only the full, raw HTML content for the email body. Do not include any other text or explanation.
        `,
        model: 'googleai/gemini-2.0-flash',
        config: {
            temperature: 0.3,
        },
    });

  const { output } = await welcomeEmailPrompt(input);
  
  if (!output) {
    const errorMessage = "No se pudo generar el contenido del correo electrónico.";
    console.error(`[send-welcome-email] ${errorMessage}`);
    return { success: false, message: errorMessage };
  }

  try {
    await transporter.sendMail({
        ...mailOptions,
        to: input.email,
        subject: "¡Bienvenido a Poli 2.0! Tus Credenciales de Acceso",
        html: output,
    });
    console.log(`[send-welcome-email] Welcome email sent successfully to ${input.email}`);
    return { success: true, message: "Correo de bienvenida enviado exitosamente." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al enviar el correo.";
    console.error(`[send-welcome-email] Failed to send email to ${input.email}:`, error);
    // Aunque el correo falle, no queremos que falle todo el proceso de inscripción.
    // El flujo principal puede decidir cómo manejar este fallo.
    return { success: false, message: `No se pudo enviar el correo de bienvenida: ${message}` };
  }
}
