import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getOverallAnalytics } from '@/lib/services/campaign.service';

export async function GET() {
  try {
    const user = await currentUser();
    const stats = await getOverallAnalytics(user?.id);
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
