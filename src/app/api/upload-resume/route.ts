import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('resume')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file uploaded' }, { status: 400 });
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `users/${user?.id || 'guest'}/${Date.now()}_${safeFilename}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local uploads directory as backup
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, `${Date.now()}_${safeFilename}`);
    fs.writeFileSync(localFilePath, buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      path: localFilePath,
      objectKey,
      size: file.size,
    });
  } catch (err: any) {
    console.error('Error uploading resume:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload resume' }, { status: 500 });
  }
}
