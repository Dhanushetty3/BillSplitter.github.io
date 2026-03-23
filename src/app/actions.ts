'use client';

// Types previously imported from AI flows are now defined here
// to remove server-side code from the static build.
export type ExtractBillItemsOutput = {
  restaurantName?: string;
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
};

export type UploadDigitalBillOutput = {
  place: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  items: {
    name: string;
    amount: number;
  }[];
  participants: string[];
};

export type AddItemsWithNaturalLanguageOutput = {
  items: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
  }[];
};


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

const staticSiteError = 'AI features are disabled on this static version of the app. Please run the project locally to use this functionality.';

export async function analyzeBillImage(
  dataUri: string
): Promise<ActionResult<ExtractBillItemsOutput>> {
  console.error(staticSiteError, dataUri);
  return { success: false, error: staticSiteError };
}

export async function analyzeDigitalBill(
  dataUri: string
): Promise<ActionResult<UploadDigitalBillOutput>> {
  console.error(staticSiteError, dataUri);
  return { success: false, error: staticSiteError };
}

export async function processNaturalLanguageItems(
  naturalLanguageInput: string,
  participants: {name: string}[]
): Promise<ActionResult<AddItemsWithNaturalLanguageOutput>> {
  console.error(staticSiteError, naturalLanguageInput, participants);
  if (participants.length === 0) {
      return { success: false, error: 'Please add participants before using this feature.' };
  }
  return { success: false, error: staticSiteError };
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
