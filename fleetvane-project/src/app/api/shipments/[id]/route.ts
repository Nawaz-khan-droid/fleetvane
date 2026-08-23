import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

// Next.js 16: dynamic route params arrive as a Promise and must be awaited.
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/shipments/${id}`);

  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/shipments/${id}/status`);

  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/shipments/${id}`);

  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
