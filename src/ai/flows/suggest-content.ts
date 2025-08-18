'use server';

/**
 * @fileOverview An AI agent that suggests relevant content and navigation links based on user activity.
 *
 * - suggestContent - A function that suggests content based on user activity.
 * - SuggestContentInput - The input type for the suggestContent function.
 * - SuggestContentOutput - The return type for the suggestContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContentInputSchema = z.object({
  userActivity: z
    .string()
    .describe(
      'A description of the user\'s recent activity on the platform.'
    ),
  contentTypes: z
    .string()
    .describe(
      'The types of content available on the platform e.g. documentation, blog posts, videos, etc. separated by commas.'
    ),
  navigationLinks: z
    .string()
    .describe(
      'A comma separated list of navigation links available on the platform.'
    ),
});
export type SuggestContentInput = z.infer<typeof SuggestContentInputSchema>;

const SuggestContentOutputSchema = z.object({
  suggestedContent: z
    .string()
    .describe(
      'A comma-separated list of suggested content based on user activity.'
    ),
  suggestedLinks: z
    .string()
    .describe(
      'A comma-separated list of suggested navigation links based on user activity.'
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
  prompt: `You are an AI assistant designed to suggest relevant content and navigation links based on user activity on a platform.

You have access to the following information:
- User Activity: {{{userActivity}}}
- Content Types: {{{contentTypes}}}
- Navigation Links: {{{navigationLinks}}}

Based on the user's recent activity, suggest relevant content and navigation links.  Give your response as comma separated lists.

Suggested Content: 
Suggested Links:`,
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
