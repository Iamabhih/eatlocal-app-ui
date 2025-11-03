export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000, // 30 seconds default
  errorMessage: string = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Usage example:
// const data = await withTimeout(
//   supabase.from('orders').select('*'),
//   10000,
//   'Failed to load orders - request timeout'
// );
