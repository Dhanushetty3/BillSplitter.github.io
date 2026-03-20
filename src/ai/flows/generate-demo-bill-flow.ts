'use server';
/**
 * @fileOverview A Genkit flow for generating a sample bill with demo data for testing purposes.
 *
 * - generateDemoBill - A function that creates a sample bill.
 * - GenerateDemoBillOutput - The return type for the generateDemoBill function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// This flow doesn't need an input schema.

const GenerateDemoBillOutputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  items: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      quantity: z.number().describe('The quantity of the item.'),
      price: z.number().describe('The price of a single unit of the item.'),
      lineTotal: z.number().describe('The total price for this item (quantity * price).'),
    })
  ).describe('An array of extracted line items from the bill.'),
  subtotal: z.number().describe('The subtotal of all items on the bill.'),
  tax: z.number().describe('The tax amount applied to the bill.'),
  tip: z.number().describe('The tip amount on the bill.'),
  total: z.number().describe('The grand total of the bill.'),
  participants: z.array(z.string()).describe('A list of sample participant names for the demo.'),
});
export type GenerateDemoBillOutput = z.infer<typeof GenerateDemoBillOutputSchema>;

export async function generateDemoBill(): Promise<GenerateDemoBillOutput> {
  return generateDemoBillFlow();
}

const generateDemoPrompt = ai.definePrompt({
  name: 'generateDemoBillPrompt',
  output: { schema: GenerateDemoBillOutputSchema },
  prompt: `You are an AI assistant designed to create realistic sample data for a bill-splitting application.

Generate a sample restaurant bill that includes:
- A creative, plausible restaurant name.
- Between 4 and 7 distinct line items with varied names, quantities (1-3), and prices (e.g., between 5 and 50). Calculate the lineTotal for each.
- A subtotal that is the sum of all line totals.
- A tax amount that is a reasonable percentage of the subtotal (e.g., 5-10%).
- A tip amount that is a reasonable percentage of the subtotal (e.g., 15-20%).
- A total that is the sum of subtotal, tax, and tip.
- A list of 3-4 plausible first names for participants.

All monetary values should have at most two decimal places. Ensure all calculations are correct.

Example output structure:
{
  "restaurantName": "The Golden Spoon",
  "items": [
    { "name": "Classic Burger", "quantity": 2, "price": 15.50, "lineTotal": 31.00 },
    { "name": "Fries", "quantity": 1, "price": 5.00, "lineTotal": 5.00 },
    { "name": "Soda", "quantity": 2, "price": 2.50, "lineTotal": 5.00 }
  ],
  "subtotal": 41.00,
  "tax": 3.28,
  "tip": 8.20,
  "total": 52.48,
  "participants": ["Alice", "Bob", "Charlie"]
}

Generate a new, unique bill now.`,
});

const generateDemoBillFlow = ai.defineFlow(
  {
    name: 'generateDemoBillFlow',
    outputSchema: GenerateDemoBillOutputSchema,
  },
  async () => {
    const { output } = await generateDemoPrompt();
    if (!output) {
      throw new Error('Failed to generate demo bill data.');
    }
    return output;
  }
);
