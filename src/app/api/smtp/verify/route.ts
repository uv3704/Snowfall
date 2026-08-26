import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';
import { getOrCreateUser, saveUserSmtpCredentials } from '@/lib/services/user.service';

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { user, pass, fromName } = body;

    if (!user || !pass) {
      return NextResponse.json({ error: 'Email and 16-character Google App Password are required' }, { status: 400 });
    }

    // Verify SMTP connection via TLS Handshake
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''),
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    // Ensure database user row exists
    await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress,
      clerkUser.fullName ?? undefined
    );

    // Save encrypted credentials to PostgreSQL
    const saved = await saveUserSmtpCredentials(
      clerkUser.id,
      user.trim(),
      pass.trim().replace(/\s+/g, ''),
      fromName
    );

    return NextResponse.json({
      success: true,
      hasCredentials: true,
      userEmail: user.trim(),
      message: 'Gmail SMTP credentials verified and saved to your account.',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to authenticate with Gmail. Ensure 2-Step Verification is active and you are using a 16-character App Password.',
    }, { status: 400 });
  }
}
