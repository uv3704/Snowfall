import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'snowfall',
  name: 'Snowfall Deliverability Engine',
  eventKey: process.env.INNGEST_EVENT_KEY || 'local-dev-event-key',
  isDev: process.env.NODE_ENV !== 'production',
});
