import { NextRequest } from 'next/server';

const SPRING_BOOT_URL = process.env.SPRING_BOOT_URL || 'http://localhost:8080';

/**
 * Forwards a Next.js API request to the Spring Boot backend.
 * Extracts the JWT from the Next.js request headers or cookies 
 * and securely passes it to the backend.
 */
export async function forwardToBackend(req: NextRequest, endpoint: string, options?: RequestInit) {
  const url = `${SPRING_BOOT_URL}${endpoint}`;
  
  // Extract authorization token from headers or cookies
  let token = req.headers.get('authorization');
  if (!token) {
    const fvToken = req.cookies.get('fv_token')?.value;
    if (fvToken) {
      token = `Bearer ${fvToken}`;
    }
  }

  const headers = new Headers();
  // Pass along content type if present
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  
  // Forward or generate Correlation ID
  let correlationId = req.headers.get('x-correlation-id');
  if (!correlationId) {
    correlationId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  headers.set('X-Correlation-ID', correlationId);

  // Forward cookies (crucial for HttpOnly refresh_token)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }
  
  if (token) {
    headers.set('Authorization', token);
  }

  try {
    let bodyText = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        bodyText = await req.text();
      } catch (e) {
        // Body already read or empty
      }
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: bodyText ? bodyText : undefined,
      ...options,
    });

    const data = await response.text();
    let parsedData = null;
    if (data) {
        try {
            parsedData = JSON.parse(data);
        } catch(e) {
            parsedData = data;
        }
    }

    return {
      status: response.status,
      headers: response.headers,
      data: parsedData,
    };
  } catch (error) {
    console.error(`Error forwarding to backend ${endpoint}:`, error);
    return {
      status: 500,
      headers: new Headers(),
      data: { error: 'Internal Server Error (Backend Unreachable)' }
    };
  }
}
