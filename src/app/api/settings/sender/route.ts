import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getOrCreateUser, updateUser } from '@/lib/services/user.service';

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { senderProfile } = body;

    // Ensure user row exists in Postgres
    await getOrCreateUser(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress,
      clerkUser.fullName ?? undefined
    );

    if (senderProfile) {
      const updated = await updateUser(clerkUser.id, {
        name: senderProfile.name,
        title: senderProfile.title,
        highlight: senderProfile.highlight,
        contact: senderProfile.contact,
        email: senderProfile.email,
      });

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update sender profile' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Sender profile saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
