// 'use server';
/**
 * @fileOverview Summarizes a swap listing to provide a quick understanding of its key details.
 *
 * - summarizeSwapListing - A function that takes a swap listing description and returns a summary.
 * - SummarizeSwapListingInput - The input type for the summarizeSwapListing function.
 * - SummarizeSwapListingOutput - The return type for the summarizeSwapListing function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSwapListingInputSchema = z.object({
  listingDescription: z
    .string()
    .describe('The full description of the swap listing to be summarized.'),
});
export type SummarizeSwapListingInput = z.infer<typeof SummarizeSwapListingInputSchema>;

const SummarizeSwapListingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the swap listing.'),
});
export type SummarizeSwapListingOutput = z.infer<typeof SummarizeSwapListingOutputSchema>;

export async function summarizeSwapListing(input: SummarizeSwapListingInput): Promise<SummarizeSwapListingOutput> {
  return summarizeSwapListingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSwapListingPrompt',
  input: {schema: SummarizeSwapListingInputSchema},
  output: {schema: SummarizeSwapListingOutputSchema},
  prompt: `Summarize the following swap listing description in a single sentence:

{{{listingDescription}}}`,config: {
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

const summarizeSwapListingFlow = ai.defineFlow(
  {
    name: 'summarizeSwapListingFlow',
    inputSchema: SummarizeSwapListingInputSchema,
    outputSchema: SummarizeSwapListingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
