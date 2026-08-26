import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';
import { getUserById } from '@/lib/services/user.service';
import { decryptCredential } from '@/lib/encryption';
import { generatePresignedDownloadUrl } from '@/lib/storage/s3';

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(clerkUser.id);
    if (!user || !user.smtpUser || !user.encryptedSmtpPass || !user.smtpIv) {
      return NextResponse.json({ error: 'Please connect and verify your Gmail App Password in Settings first.' }, { status: 400 });
    }

    const body = await req.json();
    const { subject, body: emailBody, attachment } = body;

    const decryptedPass = decryptCredential(user.encryptedSmtpPass, user.smtpIv);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user.smtpUser,
        pass: decryptedPass,
      },
      connectionTimeout: 15000,
    });

    const attachments: any[] = [];
    if (attachment?.objectKey) {
      const presigned = await generatePresignedDownloadUrl(attachment.objectKey, 900);
      if (presigned) {
        attachments.push({ filename: attachment.filename || 'resume.pdf', path: presigned });
      }
    } else if (attachment?.path) {
      attachments.push({ filename: attachment.filename || 'resume.pdf', path: attachment.path });
    }

    const info = await transporter.sendMail({
      from: `"${user.smtpFromName || user.name}" <${user.smtpUser}>`,
      to: user.smtpUser, // Send to self
      subject: `[TEST] ${subject || 'Application for Software Engineer Roles'}`,
      text: `${emailBody || ''}\n\n---\n*This is a Snowfall test email to verify your SMTP connection.*`,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${user.smtpUser}!`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('Error sending test email:', err);
    return NextResponse.json({ error: err.message || 'Failed to send test email' }, { status: 500 });
  }
}
