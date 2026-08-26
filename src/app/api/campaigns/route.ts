import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createCampaign, getUserCampaigns } from '@/lib/services/campaign.service';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const campaigns = await getUserCampaigns(user?.id);
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const { name, template, recipients, attachmentPath, attachmentName, attachmentKey } = body;

    const result = await createCampaign({
      userId: user?.id,
      name: name || 'Outreach Campaign',
      subject: template?.subject || 'Application for Software Engineer Roles',
      bodyTemplate: template?.body || '',
      attachmentPath,
      attachmentName,
      attachmentKey,
      recipientsList: recipients || [],
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
