'use server';
/**
 * @fileOverview A Genkit flow for uploading and parsing digital bills (images or PDFs).
 *
 * - uploadDigitalBill - A function that parses bill details from an uploaded digital file.
 * - UploadDigitalBillInput - The input type for the uploadDigitalBill function.
 * - UploadDigitalBillOutput - The return type for the uploadDigitalBill function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { UploadDigitalBillInputSchema, UploadDigitalBillOutputSchema } from '@/lib/types';
import type { UploadDigitalBillInput, UploadDigitalBillOutput } from '@/lib/types';

export { type UploadDigitalBillInput, type UploadDigitalBillOutput };

export async function uploadDigitalBill(input: UploadDigitalBillInput): Promise<UploadDigitalBillOutput> {
  return uploadDigitalBillFlow(input);
}

const parseBillPrompt = ai.definePrompt({
  name: 'parseBillPrompt',
  model: 'googleai/gemini-pro',
  input: { schema: UploadDigitalBillInputSchema },
  output: { schema: UploadDigitalBillOutputSchema },
  prompt: `You are an expert at parsing financial documents. Your task is to extract all relevant information from the provided digital bill (which could be an image or a PDF) and structure it into a JSON object.

Carefully identify and extract the following details:
1.  **place**: The name of the establishment or merchant that issued the bill. This is usually at the top.
2.  **subtotal**: The total cost of items before tax and tip.
3.  **tax**: The amount of sales tax applied. If not present, output 0.
4.  **tip**: The amount of tip or gratuity. If not present, output 0.
5.  **total**: The final total amount of the bill, including all items, tax, and tip.
6.  **items**: A list of individual line items on the bill, each with its name/description and amount. Ensure all items are captured.
7.  **participants**: A list of names of any individuals explicitly mentioned on the bill as customers, guests, or in a "split by" section. If no participants are explicitly named, return an empty array.

Assume currency is INR unless otherwise specified. Ensure all monetary values are parsed as numbers. If any numeric value (subtotal, tax, tip, total, item amounts) cannot be found, use 0.

Digital Bill: {{media url=billDataUri}}`,
});

const uploadDigitalBillFlow = ai.defineFlow(
  {
    name: 'uploadDigitalBillFlow',
    inputSchema: UploadDigitalBillInputSchema,
    outputSchema: UploadDigitalBillOutputSchema,
  },
  async (input) => {
    const { output } = await parseBillPrompt(input);
    if (!output) {
      throw new Error('Failed to parse digital bill. No output from prompt.');
    }
    return output;
  }
);
