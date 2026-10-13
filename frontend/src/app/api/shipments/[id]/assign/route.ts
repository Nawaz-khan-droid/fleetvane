import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/shipments/${id}/assign`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
