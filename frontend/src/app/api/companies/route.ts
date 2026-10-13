import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const query = type ? `?type=${type}` : '';
  
  const response = await forwardToBackend(req, `/api/companies${query}`);
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
