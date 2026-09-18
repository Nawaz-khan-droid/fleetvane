import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/depots/${id}`);
  return NextResponse.json(response.data, { status: response.status, headers: response.headers });
}
