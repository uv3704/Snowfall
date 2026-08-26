import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { updateUser } from '@/lib/services/user.service';

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateUser(clerkUser.id, {
      smtpUser: null,
      encryptedSmtpPass: null,
      smtpIv: null,
      smtpFromName: null,
    });

    return NextResponse.json({ success: true, message: 'Disconnected Gmail account from your profile.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
