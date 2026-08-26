import { db, schema } from '@/lib/db';
import { eq, and, gt, sql } from 'drizzle-orm';
import { encryptCredential } from '@/lib/encryption';

// In-memory persistent cache for development mode when DATABASE_URL is not yet connected
const devUserStore: Map<string, any> = new Map();

export async function getOrCreateUser(clerkUserId: string, email?: string, name?: string) {
  if (!clerkUserId) return null;

  if (db) {
    try {
      await db.insert(schema.users)
        .values({
          id: clerkUserId,
          email: email || '',
          name: name || 'Yuvraj Singh Rathore',
          title: 'Software Engineer',
          highlight: 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
          contact: 'https://www.yuviii.in/',
          dailyLimit: 45,
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            updatedAt: new Date(),
          },
        });

      return await db.query.users.findFirst({
        where: eq(schema.users.id, clerkUserId),
      });
    } catch (err) {
      console.error('Error in getOrCreateUser (DB):', err);
    }
  }

  // Development Fallback
  if (!devUserStore.has(clerkUserId)) {
    devUserStore.set(clerkUserId, {
      id: clerkUserId,
      email: email || process.env.GMAIL_USER || '',
      name: name || process.env.SENDER_NAME || 'Yuvraj Singh Rathore',
      title: 'Software Engineer',
      highlight: 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
      contact: 'https://www.yuviii.in/',
      smtpUser: process.env.GMAIL_USER || '',
      encryptedSmtpPass: process.env.GMAIL_APP_PASSWORD ? 'dev_saved' : '',
      smtpIv: 'dev_iv',
      smtpFromName: process.env.SENDER_NAME || 'Yuvraj Singh Rathore',
      dailyLimit: 45,
    });
  }

  return devUserStore.get(clerkUserId);
}

export async function getUserById(userId: string) {
  if (!userId) return null;

  if (db) {
    try {
      return await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
    } catch (err) {
      console.error('Error in getUserById (DB):', err);
    }
  }

  return devUserStore.get(userId) || null;
}

export async function updateUser(userId: string, updates: Partial<typeof schema.users.$inferInsert>) {
  if (!userId) return null;

  if (db) {
    try {
      await getOrCreateUser(userId);

      await db.update(schema.users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));

      return await getUserById(userId);
    } catch (err) {
      console.error('Error in updateUser (DB):', err);
    }
  }

  // Development Fallback
  const existing = await getOrCreateUser(userId);
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
  devUserStore.set(userId, updated);
  return updated;
}

export async function saveUserSmtpCredentials(userId: string, userEmail: string, appPassword: string, fromName?: string) {
  if (!userId || !userEmail || !appPassword) return null;

  const { encryptedText, iv } = encryptCredential(appPassword.trim());

  return await updateUser(userId, {
    smtpUser: userEmail.trim(),
    encryptedSmtpPass: encryptedText,
    smtpIv: iv,
    smtpFromName: fromName ? fromName.trim() : '',
  });
}

export async function getRolling24hSentCount(userId?: string): Promise<number> {
  if (!db) return 0;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const conditions = [
      gt(schema.sendLogs.sentAt, twentyFourHoursAgo),
      eq(schema.sendLogs.status, 'sent'),
    ];

    if (userId) {
      conditions.push(eq(schema.sendLogs.userId, userId));
    }

    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.sendLogs)
      .where(and(...conditions));

    return result?.count || 0;
  } catch (err) {
    console.error('Error querying rolling 24h count:', err);
    return 0;
  }
}
