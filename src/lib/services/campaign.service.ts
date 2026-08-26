import { db, schema } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getRolling24hSentCount, getOrCreateUser } from './user.service';
import { decryptCredential } from '@/lib/encryption';
import { renderEmail } from '@/lib/email';
import { isEmailBlacklisted } from './blacklist.service';

// In-memory development store when PostgreSQL DATABASE_URL is not yet connected
const devCampaignStore: Map<string, any> = new Map();
const devRecipientStore: Map<string, any[]> = new Map();
const activeDispatchers: Set<string> = new Set();

export async function createCampaign(params: {
  userId?: string;
  name: string;
  subject: string;
  bodyTemplate: string;
  attachmentPath?: string;
  attachmentName?: string;
  attachmentKey?: string;
  recipientsList: any[];
}) {
  const campaignId = crypto.randomUUID();
  const selectedList = (params.recipientsList || []).filter((r) => r.selected !== false);
  const selectedCount = selectedList.length;

  const campaignObj = {
    id: campaignId,
    userId: params.userId || 'guest',
    name: params.name || 'Outreach Campaign',
    subject: params.subject,
    bodyTemplate: params.bodyTemplate,
    attachmentPath: params.attachmentPath || null,
    attachmentName: params.attachmentName || null,
    attachmentKey: params.attachmentKey || null,
    status: 'draft',
    totalCount: selectedCount,
    sentCount: 0,
    failedCount: 0,
    suppressedCount: 0,
    dailyLimit: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const recipientObjects = selectedList.map((r, idx) => ({
    id: crypto.randomUUID(),
    campaignId,
    email: (r.email || '').trim().toLowerCase(),
    name: r.name || '',
    company: r.company || '',
    role: r.role || '',
    location: r.location || '',
    customData: r.custom_data || r.raw || null,
    subjectOverride: r.subject || null,
    bodyOverride: r.body || null,
    status: 'pending',
    selected: 1,
    attemptCount: 0,
    lastAttemptAt: null,
    sentAt: null,
    errorCode: null,
    suppressionReason: null,
    createdAt: new Date(Date.now() + idx * 10),
  }));

  // Store in development memory cache
  devCampaignStore.set(campaignId, campaignObj);
  devRecipientStore.set(campaignId, recipientObjects);

  if (db) {
    try {
      await db.insert(schema.campaigns).values(campaignObj);

      const chunkSize = 100;
      for (let i = 0; i < recipientObjects.length; i += chunkSize) {
        await db.insert(schema.recipients).values(recipientObjects.slice(i, i + chunkSize));
      }
    } catch (err) {
      console.error('Error inserting campaign into DB:', err);
    }
  }

  return { success: true, campaignId };
}

export async function getUserCampaigns(userId?: string) {
  if (db) {
    try {
      const condition = userId ? eq(schema.campaigns.userId, userId) : undefined;
      return await db.query.campaigns.findMany({
        where: condition,
        orderBy: [desc(schema.campaigns.createdAt)],
      });
    } catch (err) {
      console.error('Error fetching user campaigns (DB):', err);
    }
  }

  return Array.from(devCampaignStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCampaignById(campaignId: string, userId?: string) {
  if (!campaignId) return null;

  if (db) {
    try {
      const condition = userId
        ? and(eq(schema.campaigns.id, campaignId), eq(schema.campaigns.userId, userId))
        : eq(schema.campaigns.id, campaignId);

      const campaign = await db.query.campaigns.findFirst({
        where: condition,
      });

      if (campaign) {
        const campaignRecipients = await db.query.recipients.findMany({
          where: eq(schema.recipients.campaignId, campaignId),
          orderBy: [desc(schema.recipients.createdAt)],
        });

        const logs = await db.query.sendLogs.findMany({
          where: eq(schema.sendLogs.campaignId, campaignId),
          orderBy: [desc(schema.sendLogs.sentAt)],
          limit: 100,
        });

        return { campaign, recipients: campaignRecipients, logs };
      }
    } catch (err) {
      console.error('Error fetching campaign by id (DB):', err);
    }
  }

  const campaign = devCampaignStore.get(campaignId);
  if (!campaign) return null;
  const recipients = devRecipientStore.get(campaignId) || [];
  return { campaign, recipients, logs: [] };
}

export async function deleteCampaign(campaignId: string, userId?: string) {
  if (!campaignId) return false;

  devCampaignStore.delete(campaignId);
  devRecipientStore.delete(campaignId);

  if (db) {
    try {
      const condition = userId
        ? and(eq(schema.campaigns.id, campaignId), eq(schema.campaigns.userId, userId))
        : eq(schema.campaigns.id, campaignId);

      await db.delete(schema.campaigns).where(condition);
      return true;
    } catch (err) {
      console.error('Error deleting campaign:', err);
      return false;
    }
  }

  return true;
}

export async function getOverallAnalytics(userId?: string) {
  const rolling24h = await getRolling24hSentCount(userId);

  if (db) {
    try {
      const campCondition = userId ? eq(schema.campaigns.userId, userId) : undefined;
      const allCampaigns = await db.query.campaigns.findMany({
        where: campCondition,
        orderBy: [desc(schema.campaigns.createdAt)],
      });

      const totalDelivered = allCampaigns.reduce((acc: number, c: any) => acc + (c.sentCount || 0), 0);
      const totalFailed = allCampaigns.reduce((acc: number, c: any) => acc + (c.failedCount || 0), 0);
      const totalSuppressed = allCampaigns.reduce((acc: number, c: any) => acc + (c.suppressedCount || 0), 0);
      const totalRecipients = allCampaigns.reduce((acc: number, c: any) => acc + (c.totalCount || 0), 0);
      const totalScheduled = Math.max(0, totalRecipients - totalDelivered - totalFailed - totalSuppressed);

      const completedActions = totalDelivered + totalFailed + totalSuppressed;
      const deliverabilityRate = completedActions > 0
        ? ((totalDelivered / completedActions) * 100).toFixed(1)
        : '100.0';

      const allRecipients = await db.query.recipients.findMany({
        orderBy: [desc(schema.recipients.createdAt)],
        limit: 250,
      });

      const campaignMap = new Map(allCampaigns.map((c: any) => [c.id, c.name]));

      const enrichedRecipients = allRecipients.map((r: any) => ({
        ...r,
        campaignName: campaignMap.get(r.campaignId) || 'Outreach Campaign',
      }));

      return {
        totalRecipients,
        totalDelivered,
        totalScheduled,
        totalSuppressed,
        totalFailed,
        rolling24h,
        deliverabilityRate,
        totalCampaigns: allCampaigns.length,
        recipients: enrichedRecipients,
      };
    } catch (err) {
      console.error('Error computing analytics (DB):', err);
    }
  }

  // Fallback memory analytics
  const allCampaigns = Array.from(devCampaignStore.values());
  const allRecipientsList = Array.from(devRecipientStore.values()).flat();

  const totalDelivered = allCampaigns.reduce((acc: number, c: any) => acc + (c.sentCount || 0), 0);
  const totalFailed = allCampaigns.reduce((acc: number, c: any) => acc + (c.failedCount || 0), 0);
  const totalSuppressed = allCampaigns.reduce((acc: number, c: any) => acc + (c.suppressedCount || 0), 0);
  const totalRecipients = allCampaigns.reduce((acc: number, c: any) => acc + (c.totalCount || 0), 0);
  const totalScheduled = Math.max(0, totalRecipients - totalDelivered - totalFailed - totalSuppressed);

  const completedActions = totalDelivered + totalFailed + totalSuppressed;
  const deliverabilityRate = completedActions > 0
    ? ((totalDelivered / completedActions) * 100).toFixed(1)
    : '100.0';

  const campaignMap = new Map(allCampaigns.map((c: any) => [c.id, c.name]));
  const enrichedRecipients = allRecipientsList.map((r: any) => ({
    ...r,
    campaignName: campaignMap.get(r.campaignId) || 'Outreach Campaign',
  }));

  return {
    totalRecipients,
    totalDelivered,
    totalScheduled,
    totalSuppressed,
    totalFailed,
    rolling24h,
    deliverabilityRate,
    totalCampaigns: allCampaigns.length,
    recipients: enrichedRecipients,
  };
}

/**
 * Autonomous background dispatcher for campaigns.
 * Works seamlessly in both local development and production.
 */
export async function startCampaignDispatchLoop(campaignId: string, userId?: string) {
  if (activeDispatchers.has(campaignId)) return;
  activeDispatchers.add(campaignId);

  // Run asynchronously in background
  (async () => {
    try {
      const campaignData = await getCampaignById(campaignId, userId);
      if (!campaignData || !campaignData.campaign) return;

      const campaign = campaignData.campaign;
      campaign.status = 'running';

      if (db) {
        await db.update(schema.campaigns).set({ status: 'running' }).where(eq(schema.campaigns.id, campaignId));
      }

      // Fetch user sender and credentials
      const user = userId ? await getOrCreateUser(userId) : null;
      let smtpUser = user?.smtpUser || process.env.GMAIL_USER || '';
      let smtpPass = '';

      if (user?.encryptedSmtpPass && user?.smtpIv && user.encryptedSmtpPass !== 'dev_saved') {
        try {
          smtpPass = decryptCredential(user.encryptedSmtpPass, user.smtpIv);
        } catch (e) {
          smtpPass = process.env.GMAIL_APP_PASSWORD || '';
        }
      } else {
        smtpPass = process.env.GMAIL_APP_PASSWORD || '';
      }

      const senderProfile = {
        name: user?.name || user?.smtpFromName || process.env.SENDER_NAME || 'Yuvraj Singh Rathore',
        title: user?.title || 'Software Engineer',
        highlight: user?.highlight || 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
        contact: user?.contact || 'https://www.yuviii.in/',
        email: smtpUser,
      };

      let transporter: nodemailer.Transporter | null = null;
      if (smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }

      const recipients = devRecipientStore.get(campaignId) || campaignData.recipients || [];
      const pendingRecipients = recipients.filter(
        (r: any) => r.status === 'pending' || r.status === 'scheduled'
      );

      const dailyLimit = campaign.dailyLimit || 45;
      const todayBatch = pendingRecipients.slice(0, dailyLimit);

      for (const recipient of todayBatch) {
        if (campaign.status === 'paused') break;

        // 1. Mark as sending
        recipient.status = 'sending';
        recipient.attemptCount = (recipient.attemptCount || 0) + 1;
        recipient.lastAttemptAt = new Date();

        if (db) {
          await db.update(schema.recipients)
            .set({ status: 'sending', attemptCount: recipient.attemptCount, lastAttemptAt: new Date() })
            .where(eq(schema.recipients.id, recipient.id));
        }

        // 2. Check Blacklist / Suppression
        const isSuppressed = await isEmailBlacklisted(recipient.email);
        if (isSuppressed) {
          recipient.status = 'suppressed';
          recipient.suppressionReason = '550 User in Global Suppression List';
          campaign.suppressedCount = (campaign.suppressedCount || 0) + 1;

          if (db) {
            await db.update(schema.recipients)
              .set({ status: 'suppressed', suppressionReason: recipient.suppressionReason })
              .where(eq(schema.recipients.id, recipient.id));
            await db.update(schema.campaigns)
              .set({ suppressedCount: campaign.suppressedCount })
              .where(eq(schema.campaigns.id, campaignId));
          }
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // 3. Render email
        const { subject, body } = renderEmail(
          { subject: recipient.subjectOverride || campaign.subject, body: recipient.bodyOverride || campaign.bodyTemplate },
          recipient,
          senderProfile
        );

        // 4. Send via Nodemailer
        try {
          if (transporter && smtpUser) {
            const mailOptions: any = {
              from: `"${senderProfile.name}" <${smtpUser}>`,
              to: recipient.email,
              subject,
              text: body,
            };

            // Attach resume if available
            if (campaign.attachmentPath && fs.existsSync(campaign.attachmentPath)) {
              mailOptions.attachments = [
                {
                  filename: campaign.attachmentName || 'Resume.pdf',
                  path: campaign.attachmentPath,
                },
              ];
            }

            await transporter.sendMail(mailOptions);
          } else {
            // Simulated development send when SMTP credentials not provided
            console.log(`[Snowfall Dev Dispatch] Sent email to ${recipient.email}`);
          }

          recipient.status = 'sent';
          recipient.sentAt = new Date();
          campaign.sentCount = (campaign.sentCount || 0) + 1;

          if (db) {
            await db.update(schema.recipients)
              .set({ status: 'sent', sentAt: new Date() })
              .where(eq(schema.recipients.id, recipient.id));
            await db.update(schema.campaigns)
              .set({ sentCount: campaign.sentCount })
              .where(eq(schema.campaigns.id, campaignId));
          }
        } catch (sendErr: any) {
          console.error(`[Snowfall Dispatch Error] ${recipient.email}:`, sendErr.message);
          recipient.status = 'failed';
          recipient.errorCode = sendErr.message || 'SMTP Transport Failed';
          campaign.failedCount = (campaign.failedCount || 0) + 1;

          if (db) {
            await db.update(schema.recipients)
              .set({ status: 'failed', errorCode: recipient.errorCode })
              .where(eq(schema.recipients.id, recipient.id));
            await db.update(schema.campaigns)
              .set({ failedCount: campaign.failedCount })
              .where(eq(schema.campaigns.id, campaignId));
          }
        }

        // Pacing delay between consecutive sends (3.5s for responsive dev progress)
        await new Promise((r) => setTimeout(r, 3500));
      }

      // Check remaining
      const allUpdated = devRecipientStore.get(campaignId) || [];
      const remaining = allUpdated.filter((r: any) => r.status === 'pending' || r.status === 'scheduled').length;
      campaign.status = remaining === 0 ? 'completed' : 'scheduled';

      if (db) {
        await db.update(schema.campaigns)
          .set({ status: campaign.status })
          .where(eq(schema.campaigns.id, campaignId));
      }
    } catch (loopErr) {
      console.error('[Dispatch Loop Error]:', loopErr);
    } finally {
      activeDispatchers.delete(campaignId);
    }
  })();
}
