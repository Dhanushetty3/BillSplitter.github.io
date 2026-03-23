'use client';

import { extractBillItems as analyzeBillImageFlow, type ExtractBillItemsOutput } from '@/ai/flows/extract-bill-items-flow';
import { uploadDigitalBill as uploadDigitalBillFlow, type UploadDigitalBillOutput } from '@/ai/flows/upload-digital-bill';
import { addItemsWithNaturalLanguage as addItemsWithNaturalLanguageFlow, type AddItemsWithNaturalLanguageOutput } from '@/ai/flows/add-items-with-natural-language-flow';

// This type was previously imported from a non-existent flow.
// It is kept here for the hardcoded demo data.
export type GenerateDemoBillOutput = {
  restaurantName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  participants: string[];
};

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
  if (process.env.NEXT_PUBLIC_USE_STATIC_ACTIONS) {
    console.error('AI features are disabled on this static version of the app. Please run the project locally to use this functionality.', dataUri);
    return { success: false, error: 'AI features are disabled on this static version of the app. Please run the project locally to use this functionality.' };
  }
  try {
    const data = await analyzeBillImageFlow({ photoDataUri: dataUri });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unknown error occurred' };
  }
}

export async function analyzeDigitalBill(
  dataUri: string
): Promise<ActionResult<UploadDigitalBillOutput>> {
  if (process.env.NEXT_PUBLIC_USE_STATIC_ACTIONS) {
    console.error('AI features are disabled on this static version of the app. Please run the project locally to use this functionality.', dataUri);
    return { success: false, error: 'AI features are disabled on this static version of the app. Please run the project locally to use this functionality.' };
  }
  try {
    const data = await uploadDigitalBillFlow({ billDataUri: dataUri });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unknown error occurred' };
  }
}

export async function processNaturalLanguageItems(
  naturalLanguageInput: string,
  participants: {name: string}[]
): Promise<ActionResult<AddItemsWithNaturalLanguageOutput>> {
  if (process.env.NEXT_PUBLIC_USE_STATIC_ACTIONS) {
    console.error('AI features are disabled on this static version of the app. Please run the project locally to use this functionality.', naturalLanguageInput, participants);
    if (participants.length === 0) {
        return { success: false, error: 'Please add participants before using this feature.' };
    }
    return { success: false, error: 'AI features are disabled on this static version of the app. Please run the project locally to use this functionality.' };
  }
  if (participants.length === 0) {
    return { success: false, error: 'Please add participants before using this feature.' };
  }
  try {
    const data = await addItemsWithNaturalLanguageFlow({
      naturalLanguageInput,
      participants: participants.map(p => p.name),
    });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unknown error occurred' };
  }
}

export async function generateDemoBill(): Promise<ActionResult<DemoBillData>> {
  try {
    // Hardcoded demo data instead of AI call
    const demoData: DemoBillData = {
      restaurantName: "The Static Spoon",
      items: [
        { name: "Dev Burger", quantity: 2, price: 18.00, lineTotal: 36.00 },
        { name: "Test Fries", quantity: 1, price: 6.50, lineTotal: 6.50 },
        { name: "Mocktail", quantity: 3, price: 8.00, lineTotal: 24.00 },
        { name: "Staging Salad", quantity: 1, price: 12.00, lineTotal: 12.00 }
      ],
      subtotal: 78.50,
      tax: 6.28,
      tip: 15.70,
      total: 100.48,
      participants: ["Alice", "Bob", "Charlie", "David"],
      isDemo: true,
    };

    // Simulate network delay for a better user experience
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, data: demoData };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error generating demo bill:', error.message);
    return { success: false, error: 'Failed to generate demo data. Please try again.' };
  }
}
