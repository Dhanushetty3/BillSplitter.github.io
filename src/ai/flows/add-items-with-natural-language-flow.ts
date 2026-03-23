'use server';
/**
 * @fileOverview A flow for adding bill items using natural language.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BillItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
  price: z.number().describe('The price of a single unit of the item.'),
  lineTotal: z.number().describe('The total price for the item line (quantity * price).'),
});

const AddItemsWithNaturalLanguageInputSchema = z.object({
  naturalLanguageInput: z.string().describe('A string describing items to add, e.g., "2 burgers at 10 each, 1 fries at 5".'),
  participants: z.array(z.object({name: z.string()})).describe('A list of participants who can be assigned to items.'),
});
export type AddItemsWithNaturalLanguageInput = z.infer<typeof AddItemsWithNaturalLanguageInputSchema>;

const AddItemsWithNaturalLanguageOutputSchema = z.object({
    items: z.array(BillItemSchema).describe('A list of items parsed from the natural language input.'),
});
export type AddItemsWithNaturalLanguageOutput = z.infer<typeof AddItemsWithNaturalLanguageOutputSchema>;

export async function addItemsWithNaturalLanguage(input: AddItemsWithNaturalLanguageInput): Promise<AddItemsWithNaturalLanguageOutput> {
  return addItemsWithNaturalLanguageFlow(input);
}

const addItemsPrompt = ai.definePrompt({
  name: 'addItemsWithNaturalLanguagePrompt',
  input: { schema: AddItemsWithNaturalLanguageInputSchema },
  output: { schema: AddItemsWithNaturalLanguageOutputSchema },
  prompt: `You are an expert at parsing natural language to structure data.
  
  Parse the user's input string to extract a list of bill items. For each item, determine its name, quantity, and price. Calculate the lineTotal for each item.
  
  The user is providing this input: {{{naturalLanguageInput}}}
  
  Here are the participants available for assignment, but do not assign them, just be aware of them: {{jsonStringify participants}}
  
  Return the extracted items in the specified JSON format.`,
});

const addItemsWithNaturalLanguageFlow = ai.defineFlow(
  {
    name: 'addItemsWithNaturalLanguageFlow',
    inputSchema: AddItemsWithNaturalLanguageInputSchema,
    outputSchema: AddItemsWithNaturalLanguageOutputSchema,
  },
  async (input) => {
    const { output } = await addItemsPrompt(input);
    return output!;
  }
);
