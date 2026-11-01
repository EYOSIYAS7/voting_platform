import { openapi } from '@/lib/openapi';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const schema = await openapi.getSchema(id);
  return NextResponse.json(schema.bundled);
}

