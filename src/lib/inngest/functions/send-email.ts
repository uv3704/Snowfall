import { inngest } from '../client';
import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { decryptCredential } from '@/lib/encryption';
import { addToBlacklist, isHardBounceError } from '@/lib/services/blacklist.service';
import { generatePresignedDownloadUrl } from '@/lib/storage/s3';

export const sendRecipientEmail = inngest.createFunction(
  {
    id: 'send-recipient-email',
    name: 'Individual Recipient Email Dispatcher',
    triggers: [{ event: 'email.send.requested' }],
    concurrency: {
      key: 'event.data.userId',
      limit: 1,
    },
  },
  async ({ event, step }: { event: any; step: any }) => {
    const {
      campaignId,
      recipientId,
      userId,
      email,
      name,
      company,
      subjectOverride,
      bodyOverride,
      attachmentPath,
      attachmentName,
      attachmentKey,
      index,
    } = event.data;

    // Step 1: Idempotency Lock & Attempt Record
    const attempt = await step.run('create_dispatch_attempt_and_lock', async () => {
      if (!db) return null;

      const recipient = await db.query.recipients.findFirst({
        where: eq(schema.recipients.id, recipientId),
      });

      // Prevent duplicate sends if already sent, suppressed, or ambiguous
      if (recipient?.status === 'sent' || recipient?.status === 'suppressed' || recipient?.status === 'ambiguous_unknown') {
        return { shouldSkip: true, reason: `Recipient already in ${recipient.status} state.` };
      }

      const attemptNumber = (recipient?.attemptCount || 0) + 1;
      const attemptId = crypto.randomUUID();
      const idempotencyKey = `dispatch:${campaignId}:${recipientId}:${attemptNumber}`;

      await db.insert(schema.dispatchAttempts).values({
        id: attemptId,
        recipientId,
        attemptNumber,
        idempotencyKey,
        status: 'sending',
      });

      await db.update(schema.recipients)
        .set({
          status: 'sending',
          attemptCount: attemptNumber,
          lastAttemptAt: new Date(),
        })
        .where(eq(schema.recipients.id, recipientId));

      return { shouldSkip: false, attemptId, idempotencyKey };
    });

    if (attempt?.shouldSkip || !db) {
      return { skipped: true, reason: attempt?.reason };
    }

    // Step 2: Fetch User SMTP Metadata & Attachment (DO NOT decrypt in step state!)
    const smtpMeta = await step.run('prepare_smtp_metadata', async () => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user || !user.smtpUser || !user.encryptedSmtpPass || !user.smtpIv) {
        throw new Error(`No Gmail SMTP credentials configured for user ${userId}`);
      }

      let attachmentUrl: string | null = null;
      if (attachmentKey) {
        attachmentUrl = await generatePresignedDownloadUrl(attachmentKey, 900);
      }

      return {
        smtpUser: user.smtpUser,
        encryptedSmtpPass: user.encryptedSmtpPass,
        smtpIv: user.smtpIv,
        fromName: user.smtpFromName || user.name || 'Yuvraj Singh Rathore',
        attachmentUrl,
      };
    });

    // Step 3: Execute SMTP TLS Handshake & Send (Decrypts ONLY in-memory during execution)
    const result = await step.run('execute_smtp_send', async () => {
      // Ephemeral in-memory decryption
      const plainPassword = decryptCredential(smtpMeta.encryptedSmtpPass, smtpMeta.smtpIv);

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpMeta.smtpUser,
          pass: plainPassword,
        },
        connectionTimeout: 15000,
        socketTimeout: 20000,
      });

      const attachments: any[] = [];
      if (smtpMeta.attachmentUrl && attachmentName) {
        attachments.push({
          filename: attachmentName,
          path: smtpMeta.attachmentUrl, // Streamed directly from S3
        });
      } else if (attachmentPath && attachmentName) {
        attachments.push({
          filename: attachmentName,
          path: attachmentPath, // Local fallback path
        });
      }

      try {
        const info = await transporter.sendMail({
          from: `"${smtpMeta.fromName}" <${smtpMeta.smtpUser}>`,
          to: email,
          subject: subjectOverride || 'Application for Software Engineer Roles',
          text: bodyOverride || '',
          attachments,
        });

        return {
          success: true,
          messageId: info.messageId,
          response: info.response,
        };
      } catch (err: any) {
        const isHardBounce = isHardBounceError(err.message);
        if (isHardBounce) {
          await addToBlacklist(email, err.message, userId);
        }

        return {
          success: false,
          error: err.message,
          isHardBounce,
        };
      }
    });

    // Step 4: Finalize State Machine in Database
    await step.run('finalize_dispatch_state', async () => {
      if (!db) return;

      if (result.success) {
        await db.update(schema.dispatchAttempts)
          .set({
            status: 'success',
            providerMessageId: result.messageId,
            completedAt: new Date(),
          })
          .where(eq(schema.dispatchAttempts.id, attempt.attemptId));

        await db.update(schema.recipients)
          .set({
            status: 'sent',
            messageId: result.messageId,
            sentAt: new Date(),
          })
          .where(eq(schema.recipients.id, recipientId));

        await db.insert(schema.sendLogs).values({
          id: crypto.randomUUID(),
          userId,
          campaignId,
          recipientId,
          email,
          status: 'sent',
          sentAt: new Date(),
        });

        await db.update(schema.campaigns)
          .set({ sentCount: sql`${schema.campaigns.sentCount} + 1` })
          .where(eq(schema.campaigns.id, campaignId));
      } else {
        const finalStatus = result.isHardBounce ? 'suppressed' : 'failed';

        await db.update(schema.dispatchAttempts)
          .set({
            status: finalStatus,
            errorMessage: result.error,
            completedAt: new Date(),
          })
          .where(eq(schema.dispatchAttempts.id, attempt.attemptId));

        await db.update(schema.recipients)
          .set({
            status: finalStatus,
            errorMessage: result.error,
            suppressionReason: result.isHardBounce ? 'Hard bounce: ' + result.error : null,
          })
          .where(eq(schema.recipients.id, recipientId));

        await db.insert(schema.sendLogs).values({
          id: crypto.randomUUID(),
          userId,
          campaignId,
          recipientId,
          email,
          status: finalStatus,
          errorMessage: result.error,
          sentAt: new Date(),
        });

        if (result.isHardBounce) {
          await db.update(schema.campaigns)
            .set({ suppressedCount: sql`${schema.campaigns.suppressedCount} + 1` })
            .where(eq(schema.campaigns.id, campaignId));
        } else {
          await db.update(schema.campaigns)
            .set({ failedCount: sql`${schema.campaigns.failedCount} + 1` })
            .where(eq(schema.campaigns.id, campaignId));
        }
      }
    });

    // Step 5: Durable Randomized Pacing Interval (45–90s) between consecutive emails
    // Randomized interval gives human cadence and safeguards IP reputation
    const delaySeconds = Math.floor(Math.random() * (90 - 45 + 1)) + 45;
    await step.sleep('randomized_pacing_cooldown', `${delaySeconds}s`);

    return {
      recipientId,
      email,
      success: result.success,
      pacingSeconds: delaySeconds,
    };
  }
);
