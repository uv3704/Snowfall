import { NextRequest, NextResponse } from 'next/server';
import { renderEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { template, sender, recipients } = body;

    if (!Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Recipients must be an array' }, { status: 400 });
    }

    const previews = recipients.map((r) => {
      const rendered = renderEmail(template || {}, r, sender || {});
      return {
        email: r.email,
        name: r.name,
        company: r.company,
        subject: r.subject || rendered.subject,
        body: r.body || rendered.body,
        selected: r.selected !== false,
      };
    });

    return NextResponse.json({ success: true, previews, recipients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
