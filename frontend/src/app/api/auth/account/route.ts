import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function DELETE(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/auth/account');
  
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
