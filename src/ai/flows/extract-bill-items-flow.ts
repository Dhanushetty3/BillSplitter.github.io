'use server';
/**
 * @fileOverview A flow for extracting structured data from a bill image.
 */

import { ai } from '@/ai/genkit';
import { 
    ExtractBillItemsInputSchema, 
    type ExtractBillItemsInput, 
    ExtractBillItemsOutputSchema, 
    type ExtractBillItemsOutput 
} from '@/lib/types';

export async function extractBillItems(input: ExtractBillItemsInput): Promise<ExtractBillItemsOutput> {
  return extractBillItemsFlow(input);
}

const extractPrompt = ai.definePrompt({
  name: 'extractBillItemsPrompt',
  model: 'googleai/gemini-pro',
  input: { schema: ExtractBillItemsInputSchema },
  output: { schema: ExtractBillItemsOutputSchema },
  prompt: `You are an expert bill reader. Analyze the provided bill image and extract the following information in the specified JSON format.
  
  - Restaurant Name
  - All individual items with their quantity, unit price, and line total.
  - Subtotal
  - Tax
  - Tip (if available, otherwise 0)
  - Grand Total

  Image to analyze: {{media url=billImage}}`,
});

const extractBillItemsFlow = ai.defineFlow(
  {
    name: 'extractBillItemsFlow',
    inputSchema: ExtractBillItemsInputSchema,
    outputSchema: ExtractBillItemsOutputSchema,
  },
  async (input) => {
    const { output } = await extractPrompt(input);
    return output!;
  }
);
