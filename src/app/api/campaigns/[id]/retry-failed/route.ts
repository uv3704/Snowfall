import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { isEmailBlacklisted } from '@/lib/services/blacklist.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const failedRecipients = await db.query.recipients.findMany({
      where: and(
        eq(schema.recipients.campaignId, id),
        eq(schema.recipients.status, 'failed')
      ),
    });

    let resetCount = 0;

    for (const r of failedRecipients) {
      // Do not retry hard-bounced or blacklisted emails
      const blacklisted = await isEmailBlacklisted(r.email);
      if (!blacklisted) {
        await db.update(schema.recipients)
          .set({
            status: 'pending',
            errorMessage: null,
          })
          .where(eq(schema.recipients.id, r.id));
        resetCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: resetCount,
      message: `Reset ${resetCount} failed recipient(s) to pending.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
