
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
  email: z.string().email().describe('The recipient\'s email address.'),
  name: z.string().describe('The name of the recipient.'),
  code: z.string().length(6).describe('The 6-digit verification code.'),
});

export type SendVerificationCodeInput = z.infer<typeof SendVerificationCodeInputSchema>;

export async function sendVerificationCode(input: SendVerificationCodeInput): Promise<string> {
  const { output } = await verificationCodePrompt(input);
  // In a real application, you would use a service like Nodemailer or SendGrid here.
  // For this demo, we'll just return the HTML content.
  return output!;
}

const verificationCodePrompt = ai.definePrompt({
  name: 'verificationCodePrompt',
  input: { schema: SendVerificationCodeInputSchema },
  output: { format: 'text' },
  prompt: `
    Generate an HTML email for a password reset request.

    The email should be addressed to {{{name}}}.
    It must contain the 6-digit verification code: {{{code}}}.

    The email should have a professional and clean design.
    - Use a header with the "Poli 2.0" logo (you can use a placeholder URL for the logo).
    - The main content should clearly state the purpose of the email.
    - The verification code should be highly visible, with large font size and bold.
    - Include a brief security notice, advising the user to ignore the email if they did not request the change.
    - Use inline CSS for styling to ensure compatibility with most email clients.
    - The overall tone should be helpful and secure.

    Return only the full HTML content of the email.
    Example of a placeholder logo: https://placehold.co/150x50/002147/FFFFFF?text=Poli+2.0
  `,
  config: {
    model: 'googleai/gemini-2.0-flash',
    temperature: 0.3,
  },
});
