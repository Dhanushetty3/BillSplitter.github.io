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
import {z} from 'genkit';

// Input Schema
const ScanPhysicalBillInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a physical bill, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanPhysicalBillInput = z.infer<typeof ScanPhysicalBillInputSchema>;

// Output Schema
const ScanPhysicalBillOutputSchema = z.object({
  placeOfTransaction: z.string().describe('The name of the establishment where the transaction occurred.'),
  date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format. Optional if not clearly visible.'),
  items: z.array(
    z.object({
      description: z.string().describe('Description of the item.'),
      amount: z.number().describe('Amount of the item.'),
    })
  ).describe('A list of individual items from the bill with their descriptions and amounts.'),
  subtotal: z.number().describe('The subtotal of all items before tax and tip.'),
  tax: z.number().describe('The tax amount applied to the bill.'),
  tip: z.number().optional().describe('The tip amount added to the bill, if specified. Optional if not present.'),
  total: z.number().describe('The total amount of the bill, including subtotal, tax, and tip.'),
}).describe('Extracted details from a scanned physical bill.');
export type ScanPhysicalBillOutput = z.infer<typeof ScanPhysicalBillOutputSchema>;

export async function scanPhysicalBill(input: ScanPhysicalBillInput): Promise<ScanPhysicalBillOutput> {
  return scanPhysicalBillFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPhysicalBillPrompt',
  input: {schema: ScanPhysicalBillInputSchema},
  output: {schema: ScanPhysicalBillOutputSchema},
  prompt: `You are an expert at extracting structured information from images of physical receipts. Your task is to analyze the provided image and extract bill details.

- Identify the establishment's name ('placeOfTransaction').
- Find the transaction date ('date') in YYYY-MM-DD format. Omit if unclear.
- List all individual 'items', each with a 'description' and 'amount'.
- Extract the 'subtotal', 'tax', and 'total' amounts.
- Extract the 'tip' amount if specified.

IMPORTANT: If any numeric value (subtotal, tax, tip, total, or item amounts) is not found or unclear, use 0 as the default.

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
