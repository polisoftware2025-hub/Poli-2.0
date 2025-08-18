'use server';

/**
 * @fileOverview Un agente de IA que sugiere contenido relevante y enlaces de navegación basados en la actividad del usuario.
 *
 * - suggestContent - Una función que sugiere contenido basado en la actividad del usuario.
 * - SuggestContentInput - El tipo de entrada para la función suggestContent.
 * - SuggestContentOutput - El tipo de retorno para la función suggestContent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContentInputSchema = z.object({
  userActivity: z
    .string()
    .describe(
      'Una descripción de la actividad reciente del usuario en la plataforma.'
    ),
  contentTypes: z
    .string()
    .describe(
      'Los tipos de contenido disponibles en la plataforma, por ejemplo, documentación, publicaciones de blog, videos, etc., separados por comas.'
    ),
  navigationLinks: z
    .string()
    .describe(
      'Una lista separada por comas de los enlaces de navegación disponibles en la plataforma.'
    ),
});
export type SuggestContentInput = z.infer<typeof SuggestContentInputSchema>;

const SuggestContentOutputSchema = z.object({
  suggestedContent: z
    .string()
    .describe(
      'Una lista separada por comas de contenido sugerido basado en la actividad del usuario.'
    ),
  suggestedLinks: z
    .string()
    .describe(
      'Una lista separada por comas de enlaces de navegación sugeridos basados en la actividad del usuario.'
    ),
});
export type SuggestContentOutput = z.infer<typeof SuggestContentOutputSchema>;

export async function suggestContent(input: SuggestContentInput): Promise<SuggestContentOutput> {
  return suggestContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestContentPrompt',
  input: {schema: SuggestContentInputSchema},
  output: {schema: SuggestContentOutputSchema},
  prompt: `Eres un asistente de IA diseñado para sugerir contenido relevante y enlaces de navegación basados en la actividad del usuario en una plataforma.

Tienes acceso a la siguiente información:
- Actividad del usuario: {{{userActivity}}}
- Tipos de contenido: {{{contentTypes}}}
- Enlaces de navegación: {{{navigationLinks}}}

Basado en la actividad reciente del usuario, sugiere contenido relevante y enlaces de navegación. Da tu respuesta como listas separadas por comas.

Contenido Sugerido:
Enlaces Sugeridos:`,
});

const suggestContentFlow = ai.defineFlow(
  {
    name: 'suggestContentFlow',
    inputSchema: SuggestContentInputSchema,
    outputSchema: SuggestContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
