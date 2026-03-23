'use server';

import {
  extractBillItems,
  type ExtractBillItemsOutput,
} from '@/ai/flows/extract-bill-items-flow';
import {
    generateDemoBill as generateDemoBillFlow,
    type GenerateDemoBillOutput
} from '@/ai/flows/generate-demo-bill-flow';
import {
  addItemsWithNaturalLanguage,
  type AddItemsWithNaturalLanguageOutput,
} from '@/ai/flows/add-items-with-natural-language-flow';


type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type DemoBillData = GenerateDemoBillOutput & { isDemo: true };

export async function analyzeBillImage(
  dataUri: string
): Promise<ActionResult<ExtractBillItemsOutput>> {
  try {
    const result = await extractBillItems({ billImage: dataUri });
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error analyzing bill image:', error.message);
    return { success: false, error: error.message };
  }
}

// analyzeDigitalBill was removed as it's not used. To restore, a flow would be needed.

export async function processNaturalLanguageItems(
  naturalLanguageInput: string,
  participants: {name: string}[]
): Promise<ActionResult<AddItemsWithNaturalLanguageOutput>> {
  try {
    if (participants.length === 0) {
        return { success: false, error: 'Please add participants before using this feature.' };
    }
    const result = await addItemsWithNaturalLanguage({ naturalLanguageInput, participants });
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error processing natural language items:', error.message);
    return { success: false, error: error.message };
  }
}


export async function generateDemoBill(): Promise<ActionResult<DemoBillData>> {
  try {
    const result = await generateDemoBillFlow();
    return { success: true, data: { ...result, isDemo: true } };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error generating demo bill:', error.message);
    // Fallback to static data if AI fails
    const demoData: DemoBillData = {
      restaurantName: "The Failsafe Fork",
      items: [
        { name: "Fallback Burger", quantity: 2, price: 15.00, lineTotal: 30.00 },
        { name: "Error Fries", quantity: 1, price: 5.50, lineTotal: 5.50 }
      ],
      subtotal: 35.50,
      tax: 2.84,
      tip: 7.10,
      total: 45.44,
      participants: ["Alice", "Bob"],
      isDemo: true,
    };
    return { success: true, data: demoData };
  }
}
