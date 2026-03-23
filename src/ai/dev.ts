import { config } from 'dotenv';
config();

import '@/ai/flows/extract-bill-items-flow';
import '@/ai/flows/upload-digital-bill.ts';
import '@/ai/flows/add-items-with-natural-language-flow.ts';
