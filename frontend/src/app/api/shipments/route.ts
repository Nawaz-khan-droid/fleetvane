import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const query = clientId ? `?clientId=${clientId}` : '';
  
  const response = await forwardToBackend(req, `/api/shipments${query}`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/shipments');
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
