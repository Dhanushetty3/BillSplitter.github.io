'use server';
/**
 * @fileOverview A flow for generating a sample restaurant bill for demo purposes.
 */

import { ai } from '@/ai/genkit';
import { 
    GenerateDemoBillOutputSchema, 
    type GenerateDemoBillOutput 
} from '@/lib/types';

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
