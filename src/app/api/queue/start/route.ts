import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { inngest } from '@/lib/inngest/client';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createCampaign } from '@/lib/services/campaign.service';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const { campaignId, campaignName, template, sender, recipients, attachment, isExistingCampaign } = body;

    let targetCampaignId = campaignId;

    if (!isExistingCampaign || !targetCampaignId) {
      const created = await createCampaign({
        userId: user?.id,
        name: campaignName || 'Outreach Campaign',
        subject: template?.subject || 'Application for Software Engineer Roles',
        bodyTemplate: template?.body || '',
        attachmentPath: attachment?.path,
        attachmentName: attachment?.filename,
        attachmentKey: attachment?.objectKey,
        recipientsList: recipients || [],
      });
      targetCampaignId = created.campaignId;
    }

    if (db) {
      await db.update(schema.campaigns)
        .set({ status: 'running' })
        .where(eq(schema.campaigns.id, targetCampaignId));
    }

    // Trigger Inngest Fan-Out Dispatcher
    try {
      await inngest.send({
        name: 'campaign.dispatch.requested',
        data: {
          campaignId: targetCampaignId,
          userId: user?.id || 'guest',
        },
      });
    } catch (inngestErr: any) {
      console.warn('[Inngest] Dispatch event trigger note:', inngestErr?.message);
    }

    // Launch dispatch loop (processes batch and updates authoritative status in real time)
    const { startCampaignDispatchLoop } = await import('@/lib/services/campaign.service');
    startCampaignDispatchLoop(targetCampaignId, user?.id);

    return NextResponse.json({
      success: true,
      campaignId: targetCampaignId,
      message: 'Campaign dispatched and processing queue.',
    });
  } catch (err: any) {
    console.error('Error starting queue dispatch:', err);
    return NextResponse.json({ error: err.message || 'Failed to start dispatch' }, { status: 500 });
  }
}
