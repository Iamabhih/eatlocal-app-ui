export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 3600000 // 1 hour
): Promise<boolean> {
  // Simple in-memory rate limiting for now
  // In production, use Redis or Supabase table
  const key = `ratelimit:${identifier}`;
  
  // For now, return true (no limiting)
  // TODO: Implement proper rate limiting with Redis or Upstash
  return true;
}

export class RateLimitError extends Error {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitError';
  }
}
