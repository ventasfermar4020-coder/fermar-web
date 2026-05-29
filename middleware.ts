import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/src/env';

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * Both inputs are hashed with SHA-256 first, so the comparison always runs
 * over fixed-length (32-byte) digests and never leaks the secret's length.
 * Uses the Web Crypto API, which is available in the Edge Runtime.
 */
async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);

  const viewA = new Uint8Array(digestA);
  const viewB = new Uint8Array(digestB);

  let result = 0;
  for (let i = 0; i < viewA.length; i++) {
    result |= viewA[i] ^ viewB[i];
  }

  return result === 0;
}

/**
 * HTTP Basic Auth Middleware
 *
 * Protects admin routes with username/password authentication
 * Uses browser's built-in Basic Auth dialog
 *
 * Protected routes:
 * - /account/* (NextAuth session)
 * - /admin/*     (all admin pages, incl. /admin/orders)
 * - /api/admin/* (all admin APIs)
 */

export async function middleware(request: NextRequest) {
  // Account routes: check for NextAuth session cookie
  if (request.nextUrl.pathname.startsWith('/account')) {
    const token =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Admin routes: HTTP Basic Auth
  // Safety check: If credentials not configured, deny access
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return new NextResponse('Admin authentication not configured', {
      status: 503,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  // Get Authorization header
  const authHeader = request.headers.get('authorization');

  // If no auth header present, request authentication
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  // Extract and decode Base64 credentials
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    // Split on the FIRST colon only — passwords may legitimately contain ':'.
    const separatorIndex = credentials.indexOf(':');
    const username = separatorIndex === -1 ? credentials : credentials.slice(0, separatorIndex);
    const password = separatorIndex === -1 ? '' : credentials.slice(separatorIndex + 1);

    // Validate username and password with constant-time comparisons.
    // A single combined check avoids revealing which field was wrong.
    // Note: Using plain comparison since bcrypt doesn't work in Edge Runtime.
    // For production, ensure HTTPS is enabled to protect credentials in transit.
    const [usernameValid, passwordValid] = await Promise.all([
      constantTimeEqual(username, env.ADMIN_USERNAME),
      constantTimeEqual(password, env.ADMIN_PASSWORD),
    ]);

    if (!usernameValid || !passwordValid) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // Authentication successful, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Authentication error:', error);
    return new NextResponse('Authentication failed', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }
}

// Configure which routes to protect
export const config = {
  matcher: [
    '/account/:path*',
    // Protect the entire admin surface (pages + APIs), including /admin/orders
    // which exposes customer PII (emails, phones, addresses).
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
