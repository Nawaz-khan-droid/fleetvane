import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/users');
  return NextResponse.json(response.data, { status: response.status });
}

export async function GET(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/users');
  return NextResponse.json(response.data, { status: response.status });
}
