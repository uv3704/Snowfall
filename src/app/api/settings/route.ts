import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getOrCreateUser, getRolling24hSentCount } from '@/lib/services/user.service';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    const userId = clerkUser?.id || 'guest';
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || process.env.GMAIL_USER || '';
    const name = clerkUser?.fullName || process.env.SENDER_NAME || 'Yuvraj Singh Rathore';

    const user = await getOrCreateUser(userId, email, name);
    const rolling24h = await getRolling24hSentCount(userId);

    const hasCreds = Boolean(
      (user?.smtpUser && user?.encryptedSmtpPass) ||
      (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
    );

    const userEmail = user?.smtpUser || process.env.GMAIL_USER || '';

    return NextResponse.json({
      hasCredentials: hasCreds,
      userEmail,
      fromName: user?.smtpFromName || user?.name || name,
      senderProfile: {
        name: user?.name || name,
        title: user?.title || 'Software Engineer',
        highlight: user?.highlight || 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
        contact: user?.contact || 'https://www.yuviii.in/',
        email: user?.email || userEmail || '',
      },
      dailyLimit: user?.dailyLimit || 45,
      rolling24hUsed: rolling24h,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
