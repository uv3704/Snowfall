import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getAllBlacklist, addToBlacklist } from '@/lib/services/blacklist.service';

export async function GET() {
  try {
    const list = await getAllBlacklist(300);
    return NextResponse.json({ success: true, blacklist: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await addToBlacklist(email, reason || 'Manually added by user', user?.id);
    return NextResponse.json({ success: true, message: `Added ${email} to global suppression list.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
