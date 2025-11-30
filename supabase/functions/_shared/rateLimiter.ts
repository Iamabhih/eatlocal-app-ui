import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitConfig {
  identifier: string;
  limit: number;
  windowMs: number;
  endpoint?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Database-backed rate limiting using Supabase
 * Stores rate limit data in rate_limits table
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 3600000, // 1 hour default
  endpoint: string = 'default'
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const key = `${endpoint}:${identifier}`;

  try {
    // Clean up expired entries (older than window)
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

    // Get current rate limit entry
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Rate limit fetch error:', fetchError);
      // Fail open - allow request on error
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    if (existing) {
      // Entry exists - check if limit exceeded
      if (existing.request_count >= limit) {
        const resetAt = new Date(new Date(existing.window_start).getTime() + windowMs);
        const retryAfter = Math.max(0, resetAt.getTime() - now.getTime());

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      // Increment counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          request_count: existing.request_count + 1,
          last_request: now.toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit update error:', updateError);
      }

      const resetAt = new Date(new Date(existing.window_start).getTime() + windowMs);

      return {
        allowed: true,
        remaining: limit - existing.request_count - 1,
        resetAt,
      };
    }

    // No entry - create new one
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        key,
        identifier,
        endpoint,
        request_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString(),
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
    }

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open on error
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

/**
 * Simple in-memory rate limiter for edge function cold starts
 * Use when database is not available or for lightweight limits
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitMemory(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  const existing = memoryStore.get(key);

  if (existing) {
    if (now >= existing.resetAt) {
      // Window expired - reset
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(now + windowMs),
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(existing.resetAt),
        retryAfter: existing.resetAt - now,
      };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: limit - existing.count,
      resetAt: new Date(existing.resetAt),
    };
  }

  // New entry
  memoryStore.set(key, { count: 1, resetAt: now + windowMs });
  return {
    allowed: true,
    remaining: limit - 1,
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication
  login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  twoFactor: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 per 5 min

  // API
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
  webhook: { limit: 1000, windowMs: 60 * 1000 }, // 1000 per minute

  // Orders
  createOrder: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  cancelOrder: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute

  // Reviews
  createReview: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour

  // Email
  sendEmail: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute

  // Search
  search: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
} as const;

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${Math.ceil(retryAfter / 1000)} seconds`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  limit: number
): void {
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
  }
}
