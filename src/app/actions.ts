'use server';

import { 
  extractBillItems,
  ExtractBillItemsInput,
  ExtractBillItemsOutput
} from '@/ai/flows/extract-bill-items-flow';
import { 
  uploadDigitalBill,
  UploadDigitalBillInput,
  UploadDigitalBillOutput
} from '@/ai/flows/upload-digital-bill';
import { 
  addItemsWithNaturalLanguage,
  AddItemsWithNaturalLanguageInput,
  AddItemsWithNaturalLanguageOutput
} from '@/ai/flows/add-items-with-natural-language';

// This type was previously imported from the now-unused flow.
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
  try {
    const input: ExtractBillItemsInput = { photoDataUri: dataUri };
    const result = await extractBillItems(input);
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error analyzing bill image:', error.message);
    let userMessage = error.message || 'Failed to analyze the bill image. Please try again.';
    if (error.message?.includes('API key')) {
      userMessage = 'The Google AI API key is missing. Please create one and add it to your .env file as `GEMINI_API_KEY=YOUR_API_KEY`.';
    } else if (error.message?.includes('503')) {
      userMessage = 'The AI service is currently very busy. Please wait a moment and try again.';
    }
    return { success: false, error: userMessage };
  }
}

export async function analyzeDigitalBill(
  dataUri: string
): Promise<ActionResult<UploadDigitalBillOutput>> {
  try {
    const input: UploadDigitalBillInput = { billDataUri: dataUri };
    const result = await uploadDigitalBill(input);
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error analyzing digital bill:', error.message);
    return { success: false, error: 'Failed to parse the digital bill. Please try again.' };
  }
}

export async function processNaturalLanguageItems(
  naturalLanguageInput: string,
  participants: {name: string}[]
): Promise<ActionResult<AddItemsWithNaturalLanguageOutput>> {
  if (participants.length === 0) {
      return { success: false, error: 'Please add participants before using this feature.' };
  }
  try {
    const input: AddItemsWithNaturalLanguageInput = {
      naturalLanguageInput,
      participants: participants.map(p => p.name)
    };
    const result = await addItemsWithNaturalLanguage(input);
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error processing natural language items:', error.message);
    return { success: false, error: 'Failed to process the items. Please check your input.' };
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
