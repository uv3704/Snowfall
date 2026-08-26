import { inngest } from '../client';
import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { isEmailBlacklisted } from '@/lib/services/blacklist.service';
import { getRolling24hSentCount } from '@/lib/services/user.service';

export const campaignDispatcher = inngest.createFunction(
  {
    id: 'campaign-dispatcher',
    name: 'Campaign Daily Batch Dispatcher',
    triggers: [
      { event: 'campaign.dispatch.requested' },
    ],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { campaignId, userId } = event.data;

    // Step 1: Validate Campaign & Daily Quota Available
    const quotaCheck = await step.run('validate_campaign_and_daily_quota', async () => {
      if (!db) return null;

      const campaign = await db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, campaignId),
      });

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found.`);
      }

      // Check if paused
      if (campaign.status === 'paused') {
        return { shouldStop: true, reason: 'Campaign is manually paused.' };
      }

      const rolling24h = await getRolling24hSentCount(userId || campaign.userId || undefined);
      const dailyLimit = campaign.dailyLimit || 45;
      const availableToday = Math.max(0, dailyLimit - rolling24h);

      return {
        campaign,
        rolling24h,
        dailyLimit,
        availableToday,
      };
    });

    if (!quotaCheck || !quotaCheck.campaign || !db) return { count: 0 };
    if (quotaCheck.shouldStop) return { stopped: true, reason: quotaCheck.reason };

    const { campaign, availableToday } = quotaCheck;

    // If no quota available today, schedule resume for next 24-hour cycle
    if (availableToday <= 0) {
      await step.run('mark_campaign_scheduled_for_tomorrow', async () => {
        await db.update(schema.campaigns)
          .set({ status: 'scheduled' })
          .where(eq(schema.campaigns.id, campaignId));
      });

      // Wait for quota window to reset and re-trigger
      await step.sleep('wait_for_daily_quota_reset', '24h');

      await step.sendEvent('trigger_next_day_batch', {
        name: 'campaign.dispatch.requested',
        data: { campaignId, userId },
      });

      return { scheduledForTomorrow: true, reason: '24h quota cap reached. Resuming tomorrow.' };
    }

    // Step 2: Select and Atomically Claim Today's Batch (FIFO up to availableToday)
    const claimedBatch = await step.run('allocate_and_claim_daily_batch', async () => {
      const candidates = await db.query.recipients.findMany({
        where: and(
          eq(schema.recipients.campaignId, campaignId),
          eq(schema.recipients.selected, 1),
          eq(schema.recipients.status, 'pending')
        ),
        orderBy: [schema.recipients.createdAt],
        limit: availableToday,
      });

      const eligible = [];

      for (const r of candidates) {
        const blacklisted = await isEmailBlacklisted(r.email);
        if (blacklisted) {
          await db.update(schema.recipients)
            .set({
              status: 'suppressed',
              errorMessage: 'Suppressed: Recipient email is on global suppression list',
              suppressionReason: 'Global blacklist',
            })
            .where(eq(schema.recipients.id, r.id));

          await db.update(schema.campaigns)
            .set({ suppressedCount: sql`${schema.campaigns.suppressedCount} + 1` })
            .where(eq(schema.campaigns.id, campaignId));
        } else {
          // Atomically claim for today's dispatch
          await db.update(schema.recipients)
            .set({
              status: 'claimed',
              scheduledAt: new Date(),
            })
            .where(eq(schema.recipients.id, r.id));

          eligible.push(r);
        }
      }

      await db.update(schema.campaigns)
        .set({ status: 'running' })
        .where(eq(schema.campaigns.id, campaignId));

      return eligible;
    });

    // Check if campaign is completely done
    if (claimedBatch.length === 0) {
      const remainingPending = await step.run('check_remaining_recipients', async () => {
        const pending = await db.query.recipients.findFirst({
          where: and(
            eq(schema.recipients.campaignId, campaignId),
            eq(schema.recipients.selected, 1),
            eq(schema.recipients.status, 'pending')
          ),
        });
        return Boolean(pending);
      });

      if (!remainingPending) {
        await step.run('finalize_completed_campaign', async () => {
          await db.update(schema.campaigns)
            .set({ status: 'completed' })
            .where(eq(schema.campaigns.id, campaignId));
        });
        return { status: 'completed', message: 'All campaign recipients successfully processed.' };
      }
    }

    // Step 3: Fan-Out Granular Recipient Events for Today's Batch
    const events = claimedBatch.map((r: any, idx: number) => ({
      name: 'email.send.requested' as const,
      data: {
        campaignId,
        recipientId: r.id,
        userId: userId || campaign.userId,
        email: r.email,
        name: r.name,
        company: r.company,
        role: r.role,
        location: r.location,
        customData: r.customData,
        subjectOverride: r.subjectOverride,
        bodyOverride: r.bodyOverride,
        attachmentPath: campaign.attachmentPath,
        attachmentName: campaign.attachmentName,
        attachmentKey: campaign.attachmentKey,
        index: idx,
        total: claimedBatch.length,
      },
    }));

    if (events.length > 0) {
      await step.sendEvent('fan_out_daily_batch_events', events);
    }

    // Step 4: Check if more pending recipients remain for subsequent days
    const hasMore = await step.run('check_next_day_queue', async () => {
      const pendingCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(schema.recipients)
        .where(and(
          eq(schema.recipients.campaignId, campaignId),
          eq(schema.recipients.selected, 1),
          eq(schema.recipients.status, 'pending')
        ));

      return (pendingCount[0]?.count || 0) > 0;
    });

    // If there are more recipients, schedule the next day's allocation cycle
    if (hasMore) {
      await step.sleep('wait_for_next_daily_batch_cycle', '24h');

      await step.sendEvent('schedule_next_day_batch', {
        name: 'campaign.dispatch.requested',
        data: { campaignId, userId },
      });
    }

    return {
      dispatchedToday: events.length,
      hasMoreDaysRemaining: hasMore,
      campaignId,
    };
  }
);
