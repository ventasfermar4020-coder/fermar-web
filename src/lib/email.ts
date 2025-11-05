import { Resend } from 'resend';
import { env } from '@/src/env';

// Singleton pattern for Resend client (lazy initialization)
let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendInstance = new Resend(env.RESEND_API_KEY);
  }
  return resendInstance;
}
