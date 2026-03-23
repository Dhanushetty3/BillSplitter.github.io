'use client';

import { extractBillItems as analyzeBillImageFlow, type ExtractBillItemsOutput } from '@/ai/flows/extract-bill-items-flow';
import { uploadDigitalBill as uploadDigitalBillFlow, type UploadDigitalBillOutput } from '@/ai/flows/upload-digital-bill';
import { addItemsWithNaturalLanguage as addItemsWithNaturalLanguageFlow, type AddItemsWithNaturalLanguageOutput } from '@/ai/flows/add-items-with-natural-language-flow';

type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

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
