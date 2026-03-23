'use server';
/**
 * @fileOverview This file defines a Genkit flow for adding multiple bill items and assigning them to participants
 *               using natural language input.
 *
 * - addItemsWithNaturalLanguage - A function that processes natural language input to extract bill items.
 * - AddItemsWithNaturalLanguageInput - The input type for the addItemsWithNaturalLanguage function.
 * - AddItemsWithNaturalLanguageOutput - The return type for the addItemsWithNaturalLanguage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AddItemsWithNaturalLanguageInputSchema, AddItemsWithNaturalLanguageOutputSchema } from '@/lib/types';
import type { AddItemsWithNaturalLanguageInput, AddItemsWithNaturalLanguageOutput } from '@/lib/types';

export { type AddItemsWithNaturalLanguageInput, type AddItemsWithNaturalLanguageOutput };

export async function addItemsWithNaturalLanguage(
  input: AddItemsWithNaturalLanguageInput
): Promise<AddItemsWithNaturalLanguageOutput> {
  return addItemsWithNaturalLanguageFlow(input);
}

const addItemsPrompt = ai.definePrompt({
  name: 'addItemsWithNaturalLanguagePrompt',
  model: 'googleai/gemini-pro',
  input: { schema: AddItemsWithNaturalLanguageInputSchema },
  output: { schema: AddItemsWithNaturalLanguageOutputSchema },
  prompt: `You are an AI assistant designed to parse natural language input about bill items and assign them to participants.
Your task is to extract bill items, their amounts, who paid for them, and among whom they are split from the user's input.

Here are the participants involved in this bill: {{#each participants}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

Instructions:
- Analyze the "naturalLanguageInput" and identify individual bill items, their descriptions, and numeric amounts.
- For each item, determine who paid for it ("paidBy"). This name MUST be one of the provided participants or "unassigned" if the payer is not clear.
- For each item, determine among whom it is split ("splitAmong"). This should be an array of participant names.
    - If the input explicitly mentions "everyone" or "all" for an item, include ALL provided participant names in "splitAmong".
    - If specific names are mentioned for splitting, include only those names. These names MUST be from the provided participants list.
    - If no specific splitting instruction is given, and a "paidBy" person is identified, assume the item is split only by that person.
    - If no specific splitting instruction is given and "paidBy" is "unassigned", assume it is split among all participants.
- The amount should be a positive number.
- Respond with a JSON object containing an array of these bill items.

Example Input (naturalLanguageInput): "John paid for pizza ₹25 and coke ₹5, Sarah got salad ₹15. Everyone split fries ₹10. Mike paid ₹30 for a bottle of wine."
Example Participants: ["John", "Sarah", "Mike"]
Expected Output:
{
  "items": [
    {
      "description": "pizza",
      "amount": 25.00,
      "paidBy": "John",
      "splitAmong": ["John"]
    },
    {
      "description": "coke",
      "amount": 5.00,
      "paidBy": "John",
      "splitAmong": ["John"]
    },
    {
      "description": "salad",
      "amount": 15.00,
      "paidBy": "Sarah",
      "splitAmong": ["Sarah"]
    },
    {
      "description": "fries",
      "amount": 10.00,
      "paidBy": "unassigned",
      "splitAmong": ["John", "Sarah", "Mike"]
    },
    {
      "description": "bottle of wine",
      "amount": 30.00,
      "paidBy": "Mike",
      "splitAmong": ["Mike"]
    }
  ]
}

Now process the following:
naturalLanguageInput: {{{naturalLanguageInput}}}
Participants: {{#each participants}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}`,
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
