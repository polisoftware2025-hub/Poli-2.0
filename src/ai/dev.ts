import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-content.ts';
import '@/ai/flows/send-verification-code.ts';
import '@/ai/flows/enroll-student-flow.ts';
import '@/ai/flows/send-announcement-flow.ts';
