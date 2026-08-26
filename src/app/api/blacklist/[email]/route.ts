import { NextRequest, NextResponse } from 'next/server';
import { removeFromBlacklist } from '@/lib/services/blacklist.service';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    await removeFromBlacklist(decodeURIComponent(email));
    return NextResponse.json({ success: true, message: `Removed ${email} from blacklist.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
