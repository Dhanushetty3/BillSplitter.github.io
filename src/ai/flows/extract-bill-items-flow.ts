
'use server';
/**
 * @fileOverview A Genkit flow for extracting bill items, prices, quantities, total, tax, tip, and restaurant name from an image of a bill.
 *
 * - extractBillItems - A function that handles the bill item extraction process with retry logic.
 * - ExtractBillItemsInput - The input type for the extractBillItems function.
 * - ExtractBillItemsOutput - The return type for the extractBillItems function.
 */

import { ai } from '@/ai/genkit';
import { ExtractBillItemsInputSchema, ExtractBillItemsOutputSchema } from '@/lib/types';
import type { ExtractBillItemsInput, ExtractBillItemsOutput } from '@/lib/types';


/**
 * Helper function to handle transient API errors with retries.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isTransient = 
      error.message?.includes('503') || 
      error.message?.includes('Service Unavailable') || 
      error.message?.includes('high demand') ||
      error.message?.includes('overloaded');

    if (retries > 0 && isTransient) {
      console.warn(`Gemini API busy (503). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
}

export async function extractBillItems(input: ExtractBillItemsInput): Promise<ExtractBillItemsOutput> {
  return extractBillItemsFlow(input);
}

const extractBillItemsPrompt = ai.definePrompt({
  name: 'extractBillItemsPrompt',
  model: 'googleai/gemini-pro-vision',
  input: { schema: ExtractBillItemsInputSchema },
  output: { schema: ExtractBillItemsOutputSchema },
  prompt: `You are an expert at extracting financial details from images of bills and receipts.

Analyze the provided image of a bill and extract:
1. The restaurant or establishment name.
2. All line items: their names, quantities, individual unit prices, and line totals.
3. The bill subtotal (before tax and tip).
4. The tax amount.
5. The tip or service charge.
6. The grand total.

Ensure all monetary values are extracted as numbers. If a value is not found or is unclear, default it to 0.

Bill Image: {{media url=photoDataUri}}`,
});

const extractBillItemsFlow = ai.defineFlow(
  {
    name: 'extractBillItemsFlow',
    inputSchema: ExtractBillItemsInputSchema,
    outputSchema: ExtractBillItemsOutputSchema,
  },
  async (input) => {
    try {
      const result = await withRetry(async () => {
        const { output } = await extractBillItemsPrompt(input);
        if (!output) {
          throw new Error('The AI model returned an empty response.');
        }
        return output;
      });
      return result;
    } catch (error: any) {
      console.error('Genkit Flow Error:', error);
      // Clean up error message for user display
      let userMessage = `Extraction failed: ${error.message || 'Unknown error'}`;
      if (error.message?.includes('API key')) {
        userMessage = 'The Google AI API key is missing. Please create one and add it to your .env file as \`GEMINI_API_KEY=YOUR_API_KEY\`.';
      } else if (error.message?.includes('503')) {
        userMessage = 'The AI service is currently very busy. Please wait a moment and try again.';
      }
      throw new Error(userMessage);
    }
  }
);
