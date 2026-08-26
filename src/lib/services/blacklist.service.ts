import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

/**
 * Checks whether an error from SMTP represents a permanent hard bounce (550 / 5.1.1 / dead inbox)
 */
export function isHardBounceError(errorMsg?: string | null): boolean {
  if (!errorMsg) return false;
  const msg = errorMsg.toLowerCase();
  return (
    msg.includes('550') ||
    msg.includes('5.1.1') ||
    msg.includes('553') ||
    msg.includes('554') ||
    msg.includes('user unknown') ||
    msg.includes('mailbox unavailable') ||
    msg.includes('recipient address rejected') ||
    msg.includes('does not exist') ||
    msg.includes('no such user') ||
    msg.includes('invalid recipient') ||
    msg.includes('nxdomain') ||
    msg.includes('enotfound')
  );
}

export async function isEmailBlacklisted(email: string): Promise<boolean> {
  if (!email || !db) return false;
  const normalized = email.trim().toLowerCase();
  try {
    const res = await db.query.globalBlacklist.findFirst({
      where: eq(schema.globalBlacklist.email, normalized),
    });
    return Boolean(res);
  } catch (err) {
    console.error('Error checking blacklist:', err);
    return false;
  }
}

export async function addToBlacklist(email: string, reason: string = '550 Hard Bounce', sourceUserId?: string) {
  if (!email || !db) return;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.includes('@') ? normalized.split('@')[1] : null;

  try {
    await db.insert(schema.globalBlacklist).values({
      email: normalized,
      domain,
      reason,
      sourceUserId: sourceUserId || null,
    }).onConflictDoNothing();
  } catch (err) {
    console.error('Error adding to blacklist:', err);
  }
}

export async function getAllBlacklist(limit: number = 300) {
  if (!db) return [];
  try {
    return await db.query.globalBlacklist.findMany({
      orderBy: [desc(schema.globalBlacklist.createdAt)],
      limit,
    });
  } catch (err) {
    console.error('Error fetching blacklist:', err);
    return [];
  }
}

export async function removeFromBlacklist(email: string) {
  if (!email || !db) return;
  const normalized = email.trim().toLowerCase();
  try {
    await db.delete(schema.globalBlacklist).where(eq(schema.globalBlacklist.email, normalized));
  } catch (err) {
    console.error('Error removing from blacklist:', err);
  }
}
