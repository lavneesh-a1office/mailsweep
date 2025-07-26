import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-emails.ts';
import '@/ai/flows/fetch-emails.ts';
import '@/ai/flows/delete-emails.ts';
