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
  prompt: `You are an expert at extracting structured information from images of physical receipts and bills.
Your task is to analyze the provided image of a physical bill and extract the following details:
- The name of the establishment (place of transaction).
- The date of the transaction (if clearly visible), in YYYY-MM-DD format.
- A list of individual items, each with its description and amount.
- The subtotal amount.
- The tax amount.
- The tip amount (if present and clearly labeled).
- The grand total amount.

Be precise with amounts and descriptions. If a tip is not explicitly stated, omit the 'tip' field.
If the date is not clearly visible, omit the 'date' field.

Image of the bill: {{media url=photoDataUri}}`,
  config: {
    // Using gemini-2.5-flash-image for multimodal capabilities
    model: 'googleai/gemini-2.5-flash-image',
    responseModalities: ['TEXT'], // We only expect structured text output
    // Configure safety settings to be more lenient for receipt text extraction,
    // as receipts might contain sensitive or financial information that could
    // be flagged by overly strict filters.
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
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
