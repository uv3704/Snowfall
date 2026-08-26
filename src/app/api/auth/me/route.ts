import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getOrCreateUser, getRolling24hSentCount } from '@/lib/services/user.service';

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = clerkUser.fullName || clerkUser.firstName || 'Yuvraj Singh Rathore';

    const dbUser = await getOrCreateUser(clerkUser.id, email, name);
    const rolling24h = await getRolling24hSentCount(clerkUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: clerkUser.id,
        email: dbUser?.email || email,
        name: dbUser?.name || name,
        title: dbUser?.title || 'Software Engineer',
        highlight: dbUser?.highlight || 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
        contact: dbUser?.contact || 'https://www.yuviii.in/',
        hasCredentials: Boolean(dbUser?.smtpUser && dbUser?.encryptedSmtpPass),
        smtpUser: dbUser?.smtpUser || '',
        smtpFromName: dbUser?.smtpFromName || name,
        dailyLimit: dbUser?.dailyLimit || 45,
        rolling24hUsed: rolling24h,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
