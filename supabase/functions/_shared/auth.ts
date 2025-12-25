import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Shared authentication utilities for edge functions
 */

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  roles?: string[];
  error?: string;
}

/**
 * Verify JWT token and get user info
 * Returns authenticated user details or error
 */
export async function verifyAuth(
  authHeader: string | null,
  supabase?: SupabaseClient
): Promise<AuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  // Create Supabase client if not provided
  const client = supabase || createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return { authenticated: false, error: error?.message || 'Invalid token' };
    }

    // Get user roles
    const { data: roleData } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = roleData?.map(r => r.role) || [];

    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
      roles
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return { authenticated: false, error: message };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(authResult: AuthResult, requiredRole: string): boolean {
  return (authResult.roles?.includes(requiredRole) ||
         authResult.roles?.includes('admin') ||
         authResult.roles?.includes('superadmin')) ?? false;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(authResult: AuthResult, requiredRoles: string[]): boolean {
  return requiredRoles.some(role => hasRole(authResult, role));
}

/**
 * Get CORS headers with configurable origin
 * Falls back to wildcard in development
 */
export function getCorsHeaders(): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
    }
  );
}

/**
 * PayFast Signature Verification
 * Verifies the MD5 signature from PayFast webhooks
 */
export async function verifyPayFastSignature(
  data: Record<string, string>,
  signature: string
): Promise<boolean> {
  const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');

  // Build the signature string (alphabetically sorted, excluding signature field)
  const sortedKeys = Object.keys(data)
    .filter(key => key !== 'signature')
    .sort();

  let signatureString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  // Add passphrase if configured
  if (passphrase) {
    signatureString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  // Calculate MD5 hash
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Compare signatures (case-insensitive)
  return calculatedSignature.toLowerCase() === signature.toLowerCase();
}

/**
 * PayFast IP Whitelist Verification
 * PayFast webhooks should only come from these IPs
 */
const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '41.74.179.192',
  '41.74.179.193',
  '41.74.179.194',
  '41.74.179.195',
];

export function isPayFastIP(ip: string): boolean {
  // In sandbox mode, allow any IP
  if (Deno.env.get('PAYFAST_SANDBOX') === 'true') {
    return true;
  }
  return PAYFAST_IPS.includes(ip);
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(required: string[]): { valid: boolean; missing: string[] } {
  const missing = required.filter(v => !Deno.env.get(v));
  return { valid: missing.length === 0, missing };
}
