import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId');
  const query = driverId ? `?driverId=${driverId}` : '';

  const response = await forwardToBackend(req, `/api/incidents${query}`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/incidents');
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
