'use server';
/**
 * @fileOverview A flow for adding bill items using natural language.
 */

import { ai } from '@/ai/genkit';
import { 
    AddItemsWithNaturalLanguageInputSchema, 
    type AddItemsWithNaturalLanguageInput,
    AddItemsWithNaturalLanguageOutputSchema,
    type AddItemsWithNaturalLanguageOutput,
} from '@/lib/types';


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
