import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId } = body;

    if (campaignId && db) {
      await db.update(schema.campaigns)
        .set({ status: 'paused' })
        .where(eq(schema.campaigns.id, campaignId));
    }

    return NextResponse.json({ success: true, message: 'Campaign paused' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
