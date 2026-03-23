
'use server';
/**
 * @fileOverview This file defines a Genkit flow for scanning a physical bill
 * image, extracting item details, amounts, and summary data.
 *
 * - scanPhysicalBill - A function that handles the physical bill scanning process.
 * - ScanPhysicalBillInput - The input type for the scanPhysicalBill function.
 * - ScanPhysicalBillOutput - The return type for the scanPhysicalBill function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { ScanPhysicalBillInputSchema, ScanPhysicalBillOutputSchema } from '@/lib/types';
import type { ScanPhysicalBillInput, ScanPhysicalBillOutput } from '@/lib/types';


export async function scanPhysicalBill(input: ScanPhysicalBillInput): Promise<ScanPhysicalBillOutput> {
  return scanPhysicalBillFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPhysicalBillPrompt',
  model: 'googleai/gemini-pro',
  input: {schema: ScanPhysicalBillInputSchema},
  output: {schema: ScanPhysicalBillOutputSchema},
  prompt: `You are an expert at extracting structured information from images of physical receipts. Your task is to analyze the provided image and extract bill details according to the specified JSON schema.

- Identify the establishment's name ('placeOfTransaction'). If it's not clear, use "Unknown".
- Find the transaction date ('date') in YYYY-MM-DD format. Omit the field if it's not visible.
- List all individual 'items', each with a 'description' and 'amount'. If no items are discernible, return an empty array.
- Extract the 'subtotal', 'tax', and 'total' amounts.
- Extract the 'tip' amount if specified.

CRITICAL: If any numeric value (subtotal, tax, tip, total, or item amounts) is not found or is unclear, you MUST provide a value of 0 for that field. Do not omit these numeric fields.

Image of the bill: {{media url=photoDataUri}}`,
});

const scanPhysicalBillFlow = ai.defineFlow(
  {
    name: 'scanPhysicalBillFlow',
    inputSchema: ScanPhysicalBillInputSchema,
    outputSchema: ScanPhysicalBillOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to extract bill information from the image.');
    }
    return output;
  }
);
