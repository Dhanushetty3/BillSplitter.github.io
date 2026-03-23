'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateDemoBillOutputSchema = z.object({
  restaurantName: z.string().describe('A fictional, creative restaurant name.'),
  items: z.array(z.object({
    name: z.string().describe('The name of a fictional food or drink item.'),
    quantity: z.number().int().min(1).max(5).describe('The quantity of the item.'),
    price: z.number().min(5).max(30).describe('The price per unit of the item.'),
    lineTotal: z.number().describe('The total cost for this line item.'),
  })).min(3).max(6).describe('An array of fictional bill items.'),
  subtotal: z.number().describe('The subtotal of all items.'),
  tax: z.number().describe('A realistic tax amount for the subtotal.'),
  tip: z.number().describe('A realistic tip amount for the subtotal.'),
  total: z.number().describe('The grand total (subtotal + tax + tip).'),
  participants: z.array(z.string()).min(3).max(5).describe('A list of 3-5 common first names.'),
});
export type GenerateDemoBillOutput = z.infer<typeof GenerateDemoBillOutputSchema>;

const generateDemoBillPrompt = ai.definePrompt({
  name: 'generateDemoBillPrompt',
  output: { schema: GenerateDemoBillOutputSchema },
  prompt: `You are a demo data generator for a bill splitting app. Create a realistic but fictional bill.

Provide the following:
- A creative restaurant name.
- A list of 3 to 6 plausible food and drink items with quantities between 1 and 5, and prices between $5 and $30.
- Calculate the line total for each item.
- Calculate the subtotal for all items.
- Calculate a realistic tax amount (e.g., around 8-10% of subtotal).
- Calculate a realistic tip amount (e.g., 15-20% of subtotal).
- Calculate the grand total.
- A list of 3 to 5 common first names as participants.`,
});

export const generateDemoBill = ai.defineFlow(
  {
    name: 'generateDemoBillFlow',
    outputSchema: GenerateDemoBillOutputSchema,
  },
  async () => {
    const { output } = await generateDemoBillPrompt();
    return output!;
  }
);
