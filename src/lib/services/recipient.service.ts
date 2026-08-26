import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { isEmailBlacklisted } from './blacklist.service';

export async function getUserContactedEmails(userId?: string): Promise<Map<string, { lastSentAt: Date; campaignName: string }>> {
  const map = new Map<string, { lastSentAt: Date; campaignName: string }>();
  if (!db || !userId) return map;

  try {
    const records = await db
      .select({
        email: schema.recipients.email,
        sentAt: schema.recipients.sentAt,
        campaignName: schema.campaigns.name,
      })
      .from(schema.recipients)
      .innerJoin(schema.campaigns, eq(schema.recipients.campaignId, schema.campaigns.id))
      .where(
        and(
          eq(schema.campaigns.userId, userId),
          eq(schema.recipients.status, 'sent')
        )
      );

    for (const r of records) {
      const normalized = r.email.toLowerCase();
      if (!map.has(normalized) || (r.sentAt && map.get(normalized)!.lastSentAt < r.sentAt)) {
        map.set(normalized, {
          lastSentAt: r.sentAt || new Date(),
          campaignName: r.campaignName,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching user contacted emails:', err);
  }

  return map;
}

export async function validateAndEnrichRecipients(rawRecipients: any[], userId?: string) {
  if (!Array.isArray(rawRecipients)) return [];

  const contactedMap = userId ? await getUserContactedEmails(userId) : new Map();

  return await Promise.all(
    rawRecipients.map(async (r) => {
      const email = (r.email || '').trim().toLowerCase();
      const blacklisted = await isEmailBlacklisted(email);
      const prevContact = contactedMap.get(email);

      let warning = null;
      let selected = r.selected !== false;

      if (blacklisted) {
        warning = 'Permanently blacklisted (550 dead inbox / bounce)';
        selected = false;
      } else if (prevContact) {
        const dateStr = new Date(prevContact.lastSentAt).toLocaleDateString();
        warning = `Previously contacted on ${dateStr} in "${prevContact.campaignName}"`;
        selected = false; // Auto-uncheck by default for safety
      }

      return {
        ...r,
        email,
        isBlacklisted: blacklisted,
        previouslyContacted: Boolean(prevContact),
        previousCampaign: prevContact?.campaignName || null,
        previousSentAt: prevContact?.lastSentAt || null,
        warning,
        selected,
      };
    })
  );
}
