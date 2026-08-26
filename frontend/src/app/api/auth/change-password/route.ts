import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/auth/change-password');
  
  return NextResponse.json(response.data, {
    status: response.status,
  });
}
