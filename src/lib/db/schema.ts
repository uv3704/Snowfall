import { pgTable, varchar, text, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  title: varchar('title', { length: 255 }),
  highlight: text('highlight'),
  contact: text('contact'),
  smtpUser: varchar('smtp_user', { length: 255 }),
  encryptedSmtpPass: text('encrypted_smtp_pass'),
  smtpIv: varchar('smtp_iv', { length: 64 }),
  smtpFromName: varchar('smtp_from_name', { length: 255 }),
  dailyLimit: integer('daily_limit').default(45).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  subject: text('subject').notNull(),
  bodyTemplate: text('body_template').notNull(),
  attachmentPath: text('attachment_path'),
  attachmentName: varchar('attachment_name', { length: 255 }),
  attachmentKey: varchar('attachment_key', { length: 255 }),
  status: varchar('status', { length: 32 }).default('draft').notNull(), // draft | scheduled | running | paused | completed
  totalCount: integer('total_count').default(0).notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  failedCount: integer('failed_count').default(0).notNull(),
  suppressedCount: integer('suppressed_count').default(0).notNull(),
  dailyLimit: integer('daily_limit').default(45).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_campaigns_user_id').on(table.userId),
  statusIdx: index('idx_campaigns_status').on(table.status),
}));

export const recipients = pgTable('recipients', {
  id: varchar('id', { length: 64 }).primaryKey(),
  campaignId: varchar('campaign_id', { length: 64 }).notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 255 }),
  location: varchar('location', { length: 255 }),
  customData: jsonb('custom_data'),
  subjectOverride: text('subject_override'),
  bodyOverride: text('body_override'),
  status: varchar('status', { length: 32 }).default('pending').notNull(), // pending | scheduled | claimed | sending | sent | failed | suppressed | ambiguous_unknown
  selected: integer('selected').default(1).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  attemptCount: integer('attempt_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  errorCode: varchar('error_code', { length: 64 }),
  errorMessage: text('error_message'),
  suppressionReason: text('suppression_reason'),
  messageId: varchar('message_id', { length: 255 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignStatusIdx: index('idx_recipients_campaign_status').on(table.campaignId, table.status),
  emailIdx: index('idx_recipients_email').on(table.email),
  sentAtIdx: index('idx_recipients_sent_at').on(table.sentAt),
  scheduledAtIdx: index('idx_recipients_scheduled_at').on(table.scheduledAt),
}));

export const dispatchAttempts = pgTable('dispatch_attempts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  recipientId: varchar('recipient_id', { length: 64 }).notNull().references(() => recipients.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(), // claimed | sending | success | failed | suppressed | ambiguous_unknown
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  idempotencyIdx: uniqueIndex('idx_attempts_idempotency').on(table.idempotencyKey),
  recipientAttemptIdx: index('idx_attempts_recipient').on(table.recipientId, table.attemptNumber),
}));

export const globalBlacklist = pgTable('global_blacklist', {
  email: varchar('email', { length: 255 }).primaryKey(),
  domain: varchar('domain', { length: 255 }),
  reason: text('reason').notNull(),
  sourceUserId: varchar('source_user_id', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  domainIdx: index('idx_blacklist_domain').on(table.domain),
}));

export const sendLogs = pgTable('send_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }),
  campaignId: varchar('campaign_id', { length: 64 }).references(() => campaigns.id, { onDelete: 'cascade' }),
  recipientId: varchar('recipient_id', { length: 64 }).references(() => recipients.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userSentAtIdx: index('idx_send_logs_user_sent_at').on(table.userId, table.sentAt),
  campaignIdx: index('idx_send_logs_campaign').on(table.campaignId),
}));

export const attachments = pgTable('attachments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull(),
  filename: text('filename').notNull(),
  mimeType: varchar('mime_type', { length: 64 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_attachments_user').on(table.userId),
}));
