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

const UploadDigitalBillInputSchema = z.object({
  billDataUri: z
    .string()
    .describe(
      "A digital bill (image or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The MIME type should be for an image (e.g., 'image/jpeg', 'image/png') or a PDF ('application/pdf')."
    ),
});
export type UploadDigitalBillInput = z.infer<typeof UploadDigitalBillInputSchema>;

const BillItemSchema = z.object({
  name: z.string().describe("The name or description of the item."),
  amount: z.number().describe("The monetary amount of the item."),
});

const UploadDigitalBillOutputSchema = z.object({
  place: z.string().describe("The name of the place where the bill was generated (e.g., 'Restaurant ABC')."),
  subtotal: z.number().describe("The subtotal amount of the bill before tax and tip."),
  tax: z.number().describe("The tax amount applied to the bill."),
  tip: z.number().default(0).describe("The tip amount included in the bill, if any. Defaults to 0 if not explicitly mentioned."),
  total: z.number().describe("The total amount of the bill."),
  items: z.array(BillItemSchema).describe("A list of individual items on the bill with their names and amounts."),
  participants: z.array(z.string()).default([]).describe("A list of names of participants explicitly mentioned on the bill, if any, or an empty array if none are found."),
});
export type UploadDigitalBillOutput = z.infer<typeof UploadDigitalBillOutputSchema>;

export async function uploadDigitalBill(input: UploadDigitalBillInput): Promise<UploadDigitalBillOutput> {
  return uploadDigitalBillFlow(input);
}

const parseBillPrompt = ai.definePrompt({
  name: 'parseBillPrompt',
  model: 'gemini-1.0-pro',
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
