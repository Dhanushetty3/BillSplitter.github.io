import { z } from 'zod';

// == AI Schemas and Types ==

// This schema is shared across multiple flows
export const BillItemSchemaForAI = z.object({
    name: z.string().describe('The name of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    price: z.number().describe('The price of a single unit of the item.'),
    lineTotal: z.number().describe('The total price for the item line (quantity * price).'),
});
  
// From add-items-with-natural-language-flow.ts
export const AddItemsWithNaturalLanguageInputSchema = z.object({
    naturalLanguageInput: z.string().describe('A string describing items to add, e.g., "2 burgers at 10 each, 1 fries at 5".'),
    participants: z.array(z.object({name: z.string()})).describe('A list of participants who can be assigned to items.'),
});
export type AddItemsWithNaturalLanguageInput = z.infer<typeof AddItemsWithNaturalLanguageInputSchema>;
  
export const AddItemsWithNaturalLanguageOutputSchema = z.object({
    items: z.array(BillItemSchemaForAI).describe('A list of items parsed from the natural language input.'),
});
export type AddItemsWithNaturalLanguageOutput = z.infer<typeof AddItemsWithNaturalLanguageOutputSchema>;


// From extract-bill-items-flow.ts
export const ExtractBillItemsInputSchema = z.object({
    billImage: z.string().describe("A photo of a restaurant bill, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExtractBillItemsInput = z.infer<typeof ExtractBillItemsInputSchema>;
  
export const ExtractBillItemsOutputSchema = z.object({
    restaurantName: z.string().describe('The name of the restaurant.'),
    items: z.array(BillItemSchemaForAI).describe('A list of items on the bill.'),
    subtotal: z.number().describe('The subtotal of the bill before tax and tip.'),
    tax: z.number().describe('The total tax amount on the bill.'),
    tip: z.number().describe('The total tip or gratuity amount on the bill. If not present, this should be 0.'),
    total: z.number().describe('The grand total of the bill.'),
});
export type ExtractBillItemsOutput = z.infer<typeof ExtractBillItemsOutputSchema>;
  
// From generate-demo-bill-flow.ts
export const GenerateDemoBillOutputSchema = z.object({
    restaurantName: z.string().describe('A creative and fun name for a fictional restaurant.'),
    items: z.array(BillItemSchemaForAI).describe('A list of 2-4 items on the bill.'),
    subtotal: z.number().describe('The subtotal of the bill before tax and tip.'),
    tax: z.number().describe('The total tax amount on the bill.'),
    tip: z.number().describe('The total tip or gratuity amount on the bill.'),
    total: z.number().describe('The grand total of the bill.'),
    participants: z.array(z.string()).describe('A list of 2-3 fictional participant names (e.g., Alice, Bob).'),
});
export type GenerateDemoBillOutput = z.infer<typeof GenerateDemoBillOutputSchema>;


// == App Specific Types ==

export type DemoBillData = GenerateDemoBillOutput & { isDemo: true };

export type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
