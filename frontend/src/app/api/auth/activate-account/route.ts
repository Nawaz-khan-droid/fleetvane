import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

// Activation remains intentionally public: possession of the emailed token is the credential.
export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/auth/activate-account');
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers,
  });
}
