import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/auth/signup');
  
  const nextResponse = NextResponse.json(response.data, {
    status: response.status,
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    nextResponse.headers.set('Set-Cookie', setCookieHeader);
  }

  return nextResponse;
}
