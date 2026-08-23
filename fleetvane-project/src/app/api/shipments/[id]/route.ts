import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await forwardToBackend(req, `/api/shipments/${params.id}`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await forwardToBackend(req, `/api/shipments/${params.id}/status`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await forwardToBackend(req, `/api/shipments/${params.id}`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
