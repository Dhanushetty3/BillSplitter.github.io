'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit and export the 'ai' object
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Log all traces to the console
  logLevel: 'debug',
  // Recommended for production apps
  enableTracingAndMetrics: true,
});
