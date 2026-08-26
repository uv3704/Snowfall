import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { campaignDispatcher } from '@/lib/inngest/functions/dispatcher';
import { sendRecipientEmail } from '@/lib/inngest/functions/send-email';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    campaignDispatcher,
    sendRecipientEmail,
  ],
});
