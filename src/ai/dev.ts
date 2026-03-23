import { config } from 'dotenv';
config();

import '@/ai/flows/scan-physical-bill-flow.ts';
import '@/ai/flows/upload-digital-bill.ts';
import '@/ai/flows/add-items-with-natural-language.ts';
