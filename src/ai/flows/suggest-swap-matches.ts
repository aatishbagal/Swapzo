// src/ai/flows/suggest-swap-matches.ts
'use server';

/**
 * @fileOverview AI flow for suggesting swap matches based on user offers and needs,
 * returning descriptive strings including user IDs for contact.
 *
 * - suggestSwapMatches - A function that suggests potential swap matches.
 * - SuggestSwapMatchesInput - The input type for the suggestSwapMatches function.
 * - SuggestSwapMatchesOutput - The output type for the suggestSwapMatches function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// NEW Simple Input Schema with Mappings
const SuggestSwapMatchesInputSchema = z.object({
  userOffers: z
    .array(z.string())
    .describe('User offers as strings (e.g., "Python", "Portfolio website development").'),
  userNeeds: z
    .array(z.string())
    .describe('User needs as strings (e.g., "Java", "Gardening help").'),
  allOffers: z
    .array(z.string())
    .describe('A comprehensive list of all offers available in the system as strings.'),
  allNeeds: z
    .array(z.string())
    .describe('A comprehensive list of all needs expressed in the system as strings.'),
  // NEW: Add mapping data so AI can include user IDs in the string responses
  offerToUserId: z
    .record(z.string())
    .describe('A map where keys are offer titles/descriptions and values are associated user IDs.'),
  needToUserId: z
    .record(z.string())
    .describe('A map where keys are need titles/descriptions and values are associated user IDs.'),
});

export type SuggestSwapMatchesInput = z.infer<typeof SuggestSwapMatchesInputSchema>;

// NEW Simple Output Schema (same as original simple version)
const SuggestSwapMatchesOutputSchema = z.object({
  directMatches: z
    .array(z.string())
    .describe('List of direct swap matches as descriptive strings including user IDs.'),
  chainMatches: z
    .array(z.string())
    .describe('List of potential chain swap matches as descriptive strings including user IDs.'),
});

export type SuggestSwapMatchesOutput = z.infer<typeof SuggestSwapMatchesOutputSchema>;

export async function suggestSwapMatches(
  input: SuggestSwapMatchesInput
): Promise<SuggestSwapMatchesOutput> {
  return suggestSwapMatchesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSwapMatchesPrompt',
  input: {schema: SuggestSwapMatchesInputSchema},
  output: {schema: SuggestSwapMatchesOutputSchema},
  prompt: `You are an AI assistant designed to find potential swap matches for users on Swapzo, a barter platform.

Given a user's offers and needs, comprehensive lists of all offers and needs in the system, and mappings to their respective user IDs, identify direct and chain swap matches.

User Offers: {{userOffers}}
User Needs: {{userNeeds}}
All Offers: {{allOffers}}
All Needs: {{allNeeds}}
Offer to User Mapping: {{offerToUserId}}
Need to User Mapping: {{needToUserId}}

**Instructions:**

1.  **Identify Direct Swaps**:
    * Look for cases where the current user's offer (from userOffers) directly fulfills another user's need (from allNeeds), AND that other user's offer (from allOffers) directly fulfills the current user's need (from userNeeds).
    * Consider semantic similarity and common variations (e.g., "Portfolio website development" matches "Portfolio website", "Java" matches "java").

2.  **Identify Chain Swaps**:
    * Find potential chain swaps involving multiple users (3 or more) where a user's offer can indirectly fulfill their need through a sequence of exchanges.
    * These chains should form a cycle back to the current user, ultimately fulfilling one of their needs.

3.  **Output Format**:
    * Return matches as descriptive strings.
    * **Crucially, include the relevant user IDs for contact within the string, using the provided mappings.**

**Example Output Formats:**

* **Direct Match Example**: "Direct swap: Your Python for Java (Contact user: G2fbRV3XhNUgtnAjuQV3hcMsn2h1)"
* **Chain Match Example**: "Chain swap: Your Python → Java → Portfolio website (Contact users: G2fbRV3XhNUgtnAjuQV3hcMsn2h1, hw3wOiemEwU8SdDuFUUU6B3TCH32)"
    * For chain matches, list the user IDs of the *other* individuals involved in the chain in the order they participate.

Aim to be comprehensive but only suggest realistic and clear matches.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestSwapMatchesFlow = ai.defineFlow(
  {
    name: 'suggestSwapMatchesFlow',
    inputSchema: SuggestSwapMatchesInputSchema,
    outputSchema: SuggestSwapMatchesOutputSchema,
  },
  async input => {
    // The AI will generate string outputs directly based on the prompt instructions.
    // No complex post-processing (filtering, sorting, ID generation) is needed here.
    const {output} = await prompt(input);
    return output!; // Return the output directly as generated by the AI
  }
);