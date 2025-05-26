// src/ai/flows/suggest-swap-matches.ts
'use server';

/**
 * @fileOverview AI flow for suggesting swap matches based on user offers and needs.
 *
 * - suggestSwapMatches - A function that suggests potential swap matches.
 * - SuggestSwapMatchesInput - The input type for the suggestSwapMatches function.
 * - SuggestSwapMatchesOutput - The output type for the suggestSwapMatches function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSwapMatchesInputSchema = z.object({
  userOffers: z
    .array(z.string())
    .describe('List of offers provided by the user (e.g., skills, services, items).'),
  userNeeds: z
    .array(z.string())
    .describe('List of needs expressed by the user (e.g., skills, services, items).'),
  allOffers: z
    .array(z.string())
    .describe('A comprehensive list of all offers available in the system.'),
  allNeeds: z
    .array(z.string())
    .describe('A comprehensive list of all needs expressed in the system.'),
});

export type SuggestSwapMatchesInput = z.infer<typeof SuggestSwapMatchesInputSchema>;

const SuggestSwapMatchesOutputSchema = z.object({
  directMatches: z
    .array(z.string())
    .describe('List of direct swap matches based on user offers and needs.'),
  chainMatches: z
    .array(z.string())
    .describe('List of potential chain swap matches involving other users.'),
});

export type SuggestSwapMatchesOutput = z.infer<typeof SuggestSwapMatchesOutputSchema>;

export async function suggestSwapMatches(input: SuggestSwapMatchesInput): Promise<SuggestSwapMatchesOutput> {
  return suggestSwapMatchesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSwapMatchesPrompt',
  input: {schema: SuggestSwapMatchesInputSchema},
  output: {schema: SuggestSwapMatchesOutputSchema},
  prompt: `You are an AI assistant designed to find potential swap matches for users.

  Given a user's offers and needs, and a comprehensive list of all offers and needs in the system, identify direct and chain swap matches.

  User Offers: {{userOffers}}
  User Needs: {{userNeeds}}
  All Offers: {{allOffers}}
  All Needs: {{allNeeds}}

  Consider direct swaps where a user's offer directly fulfills another user's need, and vice versa.
  Also, identify potential chain swaps involving multiple users where a user's offer can indirectly fulfill their need through a chain of exchanges.

  Return the direct matches and chain matches in the specified output format.
  `,
});

const suggestSwapMatchesFlow = ai.defineFlow(
  {
    name: 'suggestSwapMatchesFlow',
    inputSchema: SuggestSwapMatchesInputSchema,
    outputSchema: SuggestSwapMatchesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
