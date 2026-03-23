'use server';
/**
 * @fileOverview A flow for generating a sample restaurant bill for demo purposes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BillItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
  price: z.number().describe('The price of a single unit of the item.'),
  lineTotal: z.number().describe('The total price for the item line (quantity * price).'),
});

const GenerateDemoBillOutputSchema = z.object({
  restaurantName: z.string().describe('A creative and fun name for a fictional restaurant.'),
  items: z.array(BillItemSchema).describe('A list of 2-4 items on the bill.'),
  subtotal: z.number().describe('The subtotal of the bill before tax and tip.'),
  tax: z.number().describe('The total tax amount on the bill.'),
  tip: z.number().describe('The total tip or gratuity amount on the bill.'),
  total: z.number().describe('The grand total of the bill.'),
  participants: z.array(z.string()).describe('A list of 2-3 fictional participant names (e.g., Alice, Bob).'),
});
export type GenerateDemoBillOutput = z.infer<typeof GenerateDemoBillOutputSchema>;

export async function generateDemoBill(): Promise<GenerateDemoBillOutput> {
  return generateDemoBillFlow();
}

const generatePrompt = ai.definePrompt({
  name: 'generateDemoBillPrompt',
  output: { schema: GenerateDemoBillOutputSchema },
  prompt: `You are a creative assistant. Generate a realistic but fictional restaurant bill for a demo of a bill-splitting app.
  
  Please provide the following details in the specified JSON format:
  - A creative and fun name for a fictional restaurant.
  - A list of 2 to 4 plausible food or drink items. For each item, include its quantity, price, and line total.
  - A subtotal for all items.
  - A tax amount (calculated based on the subtotal).
  - A tip amount (calculated based on the subtotal).
  - A grand total.
  - A list of 2 or 3 fictional names for the people who shared the meal.`,
});

const generateDemoBillFlow = ai.defineFlow(
  {
    name: 'generateDemoBillFlow',
    outputSchema: GenerateDemoBillOutputSchema,
  },
  async () => {
    const { output } = await generatePrompt();
    return output!;
  }
);
