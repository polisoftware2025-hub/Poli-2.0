import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-content.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/enroll-student-flow.ts';
import '@/ai/flows/send-announcement-flow.ts';
import '@/ai/flows/send-verification-code.ts';
