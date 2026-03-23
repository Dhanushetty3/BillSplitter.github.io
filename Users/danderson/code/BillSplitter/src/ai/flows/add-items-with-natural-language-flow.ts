'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AddItemsWithNaturalLanguageOutputSchema = z.object({
  items: z.array(z.object({
    description: z.string(),
    amount: z.number(),
    paidBy: z.string(),
    splitAmong: z.array(z.string()),
  })),
});
export type AddItemsWithNaturalLanguageOutput = z.infer<typeof AddItemsWithNaturalLanguageOutputSchema>;

const AddItemsWithNaturalLanguageInputSchema = z.object({
  naturalLanguageInput: z.string(),
  participants: z.array(z.object({ name: z.string() })),
});

const addItemsWithNaturalLanguagePrompt = ai.definePrompt({
  name: 'addItemsWithNaturalLanguagePrompt',
  input: { schema: AddItemsWithNaturalLanguageInputSchema },
  output: { schema: AddItemsWithNaturalLanguageOutputSchema },
  prompt: `You are an AI assistant for a bill splitting app. Your task is to parse a natural language string to add multiple items to a bill and assign them to participants.

The user input is:
"{{naturalLanguageInput}}"

The participants in the group are:
{{#each participants}}
- {{this.name}}
{{/each}}

From the user input, extract each item's description, amount, who paid for it, and who it should be split among.
- The 'paidBy' field must be one of the participant names. If not specified, choose the first participant.
- The 'splitAmong' field must be an array of participant names. If not specified, split among all participants.
- If amounts are not specified, you can leave them as 0.`,
});

export const addItemsWithNaturalLanguage = ai.defineFlow(
  {
    name: 'addItemsWithNaturalLanguageFlow',
    inputSchema: AddItemsWithNaturalLanguageInputSchema,
    outputSchema: AddItemsWithNaturalLanguageOutputSchema,
  },
  async (input) => {
    const { output } = await addItemsWithNaturalLanguagePrompt(input);
    return output!;
  }
);
