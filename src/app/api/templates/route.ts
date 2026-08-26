import { NextResponse } from 'next/server';
import { PRESET_TEMPLATES } from '@/lib/email';

export async function GET() {
  return NextResponse.json({ templates: PRESET_TEMPLATES });
}
