import { QueryCache, MutationCache } from '@tanstack/react-query';
import { loggingService } from '@/services/loggingService';

export const queryCache = new QueryCache({
  onError: (error, query) => {
    const startTime = query.state.dataUpdatedAt || Date.now();
    const duration = Date.now() - startTime;

    loggingService.logApiCall({
      endpoint: `Query: ${query.queryKey.join('/')}`,
      method: 'GET',
      duration_ms: duration,
      success: false,
      error_message: error instanceof Error ? error.message : String(error),
    });
  },
  onSuccess: (_data, query) => {
    const startTime = query.state.dataUpdatedAt || Date.now();
    const duration = Date.now() - startTime;

    loggingService.logApiCall({
      endpoint: `Query: ${query.queryKey.join('/')}`,
      method: 'GET',
      duration_ms: duration,
      success: true,
    });
  },
});

export const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    loggingService.logApiCall({
      endpoint: `Mutation: ${mutation.options.mutationKey?.join('/') || 'unknown'}`,
      method: 'POST',
      duration_ms: 0,
      success: false,
      error_message: error instanceof Error ? error.message : String(error),
    });
  },
  onSuccess: (_data, _variables, _context, mutation) => {
    loggingService.logApiCall({
      endpoint: `Mutation: ${mutation.options.mutationKey?.join('/') || 'unknown'}`,
      method: 'POST',
      duration_ms: 0,
      success: true,
    });
  },
});
