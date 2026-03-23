'use server';
/**
 * @fileOverview A flow for extracting structured data from a bill image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BillItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
  price: z.number().describe('The price of a single unit of the item.'),
  lineTotal: z.number().describe('The total price for the item line (quantity * price).'),
});

const ExtractBillItemsInputSchema = z.object({
  billImage: z.string().describe("A photo of a restaurant bill, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExtractBillItemsInput = z.infer<typeof ExtractBillItemsInputSchema>;

const ExtractBillItemsOutputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  items: z.array(BillItemSchema).describe('A list of items on the bill.'),
  subtotal: z.number().describe('The subtotal of the bill before tax and tip.'),
  tax: z.number().describe('The total tax amount on the bill.'),
  tip: z.number().describe('The total tip or gratuity amount on the bill. If not present, this should be 0.'),
  total: z.number().describe('The grand total of the bill.'),
});
export type ExtractBillItemsOutput = z.infer<typeof ExtractBillItemsOutputSchema>;

export async function extractBillItems(input: ExtractBillItemsInput): Promise<ExtractBillItemsOutput> {
  return extractBillItemsFlow(input);
}

const extractPrompt = ai.definePrompt({
  name: 'extractBillItemsPrompt',
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
