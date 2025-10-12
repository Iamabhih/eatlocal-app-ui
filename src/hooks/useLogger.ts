import { useCallback } from 'react';
import { loggingService } from '@/services/loggingService';

export function useLogger(componentName?: string) {
  const logClick = useCallback((element: HTMLElement) => {
    loggingService.logClick(element, componentName);
  }, [componentName]);

  const logAction = useCallback((action: string, success: boolean, metadata?: any) => {
    loggingService.logSystem({
      log_level: success ? 'info' : 'error',
      log_type: 'click',
      component: componentName,
      action,
      success,
      metadata,
    });
  }, [componentName]);

  const logError = useCallback((error: Error, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    loggingService.logError({
      error_type: error.name,
      error_message: error.message,
      stack_trace: error.stack,
      component: componentName,
      severity,
    });
  }, [componentName]);

  const logFormSubmit = useCallback((formName: string, success: boolean, error?: string) => {
    loggingService.logFormSubmit(formName, success, error);
  }, []);

  return {
    logClick,
    logAction,
    logError,
    logFormSubmit,
  };
}
