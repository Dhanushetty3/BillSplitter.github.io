'use server';

import { 
  scanPhysicalBill,
  ScanPhysicalBillInput,
  ScanPhysicalBillOutput
} from '@/ai/flows/scan-physical-bill-flow';
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

type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export async function analyzeBillImage(
  dataUri: string
): Promise<ActionResult<ScanPhysicalBillOutput>> {
  try {
    const input: ScanPhysicalBillInput = { photoDataUri: dataUri };
    // The AI flow function is already an async function
    const result = await scanPhysicalBill(input);
    return { success: true, data: result };
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('Error analyzing bill image:', error.message);
    return { success: false, error: 'Failed to analyze the bill image. Please try again.' };
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
