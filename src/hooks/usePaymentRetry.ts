import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface PaymentRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export function usePaymentRetry(options: PaymentRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 2000 } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const executeWithRetry = async <T,>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        
        if (attempt > 0) {
          setIsRetrying(true);
          logger.log(`Retry attempt ${attempt} for ${operationName}`);
          
          toast({
            title: 'Retrying...',
            description: `Attempt ${attempt} of ${maxRetries}`,
          });

          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }

        const result = await operation();
        
        if (attempt > 0) {
          toast({
            title: 'Success!',
            description: 'Operation completed successfully',
          });
        }
        
        setIsRetrying(false);
        setRetryCount(0);
        return result;

      } catch (error) {
        lastError = error as Error;
        logger.error(`${operationName} failed (attempt ${attempt + 1}):`, error);

        if (attempt === maxRetries) {
          setIsRetrying(false);
          toast({
            title: 'Operation Failed',
            description: 'Please try again or contact support',
            variant: 'destructive',
          });
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Operation failed');
  };

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
  };
}
