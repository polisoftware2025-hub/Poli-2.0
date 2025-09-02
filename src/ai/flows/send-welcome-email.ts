
'use server';
/**
 * @fileOverview A Genkit flow to generate and "send" a welcome email with credentials.
 *
 * - sendWelcomeEmail - A function that generates an HTML email with login details.
 * - SendWelcomeEmailInput - The input type for the sendWelcomeEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendWelcomeEmailInputSchema = z.object({
  email: z.string().email().describe('The recipient\'s personal email address.'),
  name: z.string().describe('The name of the recipient.'),
  institutionalEmail: z.string().email().describe('The newly generated institutional email.'),
  temporaryPassword: z.string().describe('The temporary password for the first login.'),
});

export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<string> {
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
  // In a real application, you would use a service like Nodemailer or SendGrid here.
  // For this demo, we'll just return the HTML content.
  console.log("Generated Welcome Email HTML:", output);
  return output!;
}
