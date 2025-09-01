
'use server';
/**
 * @fileOverview A Genkit flow to generate and "send" an announcement email.
 *
 * - sendAnnouncement - A function that generates an HTML email for a mass announcement.
 * - SendAnnouncementInput - The input type for the sendAnnouncement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendAnnouncementInputSchema = z.object({
  title: z.string().describe('The title of the announcement.'),
  message: z.string().describe('The main content of the announcement message.'),
  recipientGroup: z.string().describe('The target group for the announcement (e.g., "Toda la comunidad", "Estudiantes de Ingeniería").'),
});

export type SendAnnouncementInput = z.infer<typeof SendAnnouncementInputSchema>;

export async function sendAnnouncement(input: SendAnnouncementInput): Promise<string> {
    const announcementPrompt = ai.definePrompt({
        name: 'announcementPrompt',
        input: { schema: SendAnnouncementInputSchema },
        output: { format: 'text' },
        prompt: `
            Generate a professional and clean HTML email for an institutional announcement.

            The announcement is for: {{{recipientGroup}}}.
            The title of the announcement is: {{{title}}}
            The message content is:
            {{{message}}}

            The email should have the following structure and style:
            - Use a header with the "Poli 2.0" logo (URL: https://placehold.co/150x50/002147/FFFFFF?text=Poli+2.0).
            - The title should be a prominent H1 heading.
            - The recipient group should be mentioned below the title (e.g., "Para: Toda la comunidad").
            - The message content should be formatted in paragraphs.
            - Include a footer with "Atentamente, El equipo de Poli 2.0".
            - Use inline CSS for styling to ensure maximum compatibility with email clients.
            - The color palette should be based on the institutional colors: dark blue (#002147) for headers and accents, and a clean white/light gray background.

            Return only the full, raw HTML content for the email body. Do not include any other text or explanation.
        `,
        model: 'googleai/gemini-2.0-flash',
        config: {
            temperature: 0.2,
        },
    });

  const { output } = await announcementPrompt(input);
  // In a real application, you would use a service like Nodemailer or SendGrid here
  // to send the generated HTML to a list of recipients based on the recipientGroup.
  // For this demo, we'll just return the HTML content.
  return output!;
}
