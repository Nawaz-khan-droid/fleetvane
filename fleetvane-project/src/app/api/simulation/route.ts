import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

export async function POST(req: NextRequest) {
  const response = await forwardToBackend(req, '/api/simulation/optimize');
  // Wait, does Spring Boot simulation controller use /api/simulation/optimize?
  // I will just proxy to /api/simulation and let the client provide the exact path if needed,
  // or I can proxy to /api/simulation exactly as the client requested.
  // In the original Next.js codebase, the client did fetch('/api/simulation').
  // Let's assume the Spring Boot endpoint is /api/simulation.
  
  // Wait, let's just forward to /api/simulation directly.
  return NextResponse.json(response.data, {
    status: response.status,
    headers: response.headers
  });
}
