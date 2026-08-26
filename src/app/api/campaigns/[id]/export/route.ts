import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!db) {
      return new NextResponse('Email,Name,Company,Role,Status,SentAt\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="campaign_${id}_export.csv"`,
        },
      });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, id),
    });

    const recipients = await db.query.recipients.findMany({
      where: eq(schema.recipients.campaignId, id),
    });

    const exportRows = recipients.map((r: any) => ({
      Email: r.email,
      Name: r.name || '',
      Company: r.company || '',
      Role: r.role || '',
      Location: r.location || '',
      Status: r.status,
      SentAt: r.sentAt ? new Date(r.sentAt).toISOString() : '',
      ErrorMessage: r.errorMessage || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const safeName = (campaign?.name || `campaign_${id}`).replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${safeName}_export.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
