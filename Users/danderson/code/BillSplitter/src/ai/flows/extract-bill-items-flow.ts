'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ExtractBillItemsOutputSchema = z.object({
  restaurantName: z.string().optional().describe('The name of the restaurant or store.'),
  items: z.array(z.object({
    name: z.string().describe('The name of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    price: z.number().describe('The price of a single unit of the item.'),
    lineTotal: z.number().describe('The total price for this line item (quantity * price).'),
  })).describe('An array of items found on the bill.'),
  subtotal: z.number().describe('The subtotal of the bill before tax and tip.'),
  tax: z.number().describe('The total tax amount on the bill.'),
  tip: z.number().describe('The total tip or gratuity amount on the bill.'),
  total: z.number().describe('The grand total of the bill.'),
});

export type ExtractBillItemsOutput = z.infer<typeof ExtractBillItemsOutputSchema>;

const ExtractBillItemsInputSchema = z.object({
  billImage: z.string().describe("A bill image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const extractBillItemsPrompt = ai.definePrompt({
  name: 'extractBillItemsPrompt',
  input: { schema: ExtractBillItemsInputSchema },
  output: { schema: ExtractBillItemsOutputSchema },
  prompt: `You are an expert at reading receipts and bills. Extract the following information from the provided image: restaurant name, all line items (including quantity, price, and line total), subtotal, tax, tip, and the grand total.

Here is the bill:
{{media url=billImage}}`
});

export const extractBillItems = ai.defineFlow(
  {
    name: 'extractBillItemsFlow',
    inputSchema: ExtractBillItemsInputSchema,
    outputSchema: ExtractBillItemsOutputSchema,
  },
  async (input) => {
    const { output } = await extractBillItemsPrompt(input);
    return output!;
  }
);
