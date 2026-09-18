import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/vehicles/${id}`);
  return NextResponse.json(response.data, { status: response.status, headers: response.headers });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const search = url.search;
  const path = url.pathname.endsWith('/status') ? `/status` : '';
  const response = await forwardToBackend(req, `/api/vehicles/${id}${path}${search}`);
  return NextResponse.json(response.data, { status: response.status, headers: response.headers });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await forwardToBackend(req, `/api/vehicles/${id}`);
  return NextResponse.json(response.data, { status: response.status, headers: response.headers });
}
