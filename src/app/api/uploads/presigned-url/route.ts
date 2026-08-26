import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { generatePresignedUploadUrl } from '@/lib/storage/s3';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const { filename, mimeType } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const presignedData = await generatePresignedUploadUrl(
      user?.id || 'guest',
      filename,
      mimeType || 'application/pdf'
    );

    return NextResponse.json({
      success: true,
      ...presignedData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
