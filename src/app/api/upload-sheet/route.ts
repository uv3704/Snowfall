import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { parseSpreadsheet } from '@/lib/parser';
import { validateAndEnrichRecipients } from '@/lib/services/recipient.service';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No spreadsheet file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = parseSpreadsheet(buffer);

    // Enrich with blacklist suppression and cross-campaign deduplication warnings
    const enrichedRecipients = await validateAndEnrichRecipients(parsed.recipients, user?.id);

    return NextResponse.json({
      success: true,
      headers: parsed.headers,
      detectedMapping: parsed.detectedMapping,
      totalRows: parsed.totalRows,
      validRows: enrichedRecipients.length,
      duplicateCount: parsed.duplicateCount,
      invalidCount: parsed.invalidCount,
      recipients: enrichedRecipients,
    });
  } catch (err: any) {
    console.error('Error parsing sheet:', err);
    return NextResponse.json({ error: err.message || 'Failed to parse spreadsheet' }, { status: 500 });
  }
}
