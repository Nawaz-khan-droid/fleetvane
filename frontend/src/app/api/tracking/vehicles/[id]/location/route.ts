import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await forwardToBackend(req, `/api/tracking/vehicles/${id}/location`);
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers,
  });
}
