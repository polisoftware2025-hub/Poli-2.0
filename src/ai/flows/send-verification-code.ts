'use server';
/**
 * @fileOverview A Genkit flow to generate and "send" a verification code email.
 *
 * - sendVerificationCode - A function that generates an HTML email with a verification code.
 * - SendVerificationCodeInput - The input type for the sendVerificationCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendVerificationCodeInputSchema = z.object({
  email: z.string().email().describe("The recipient's personal email address."),
  name: z.string().describe('The name of the recipient.'),
  code: z.string().describe('The 6-digit verification code.'),
});

export type SendVerificationCodeInput = z.infer<typeof SendVerificationCodeInputSchema>;

export async function sendVerificationCode(input: SendVerificationCodeInput): Promise<string> {
    const verificationCodePrompt = ai.definePrompt({
        name: 'verificationCodePrompt',
        input: { schema: SendVerificationCodeInputSchema },
        output: { format: 'text' },
        prompt: `
            Generate a professional HTML email for password recovery.

            The email is for {{{name}}}.
            The verification code is: {{{code}}}

            The email should have the following structure and style:
            - Use a header with the "Poli 2.0" logo (URL: https://placehold.co/150x50/002147/FFFFFF?text=Poli+2.0).
            - A clear title like "Tu Código de Verificación".
            - A message explaining that this code is for resetting their password.
            - Clearly state the verification code in a prominent way.
            - Mention that the code will expire in 10 minutes.
            - Include a footer with "Atentamente, El equipo de Poli 2.0".
            - Use inline CSS for styling to ensure maximum compatibility.
            - The color palette should be based on the institutional colors: dark blue (#002147) and accents.

            Return only the full, raw HTML content for the email body. Do not include any other text or explanation.
        `,
        model: 'googleai/gemini-2.0-flash',
        config: {
            temperature: 0.2,
        },
    });

  const { output } = await verificationCodePrompt(input);
  // In a real application, you would use a service like Nodemailer or SendGrid here.
  // For this demo, we'll just return the HTML content.
  return output!;
}
