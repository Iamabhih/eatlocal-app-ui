import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { loggingService } from '@/services/loggingService';

export function NavigationLogger() {
  const location = useLocation();
  const previousPath = useRef<string>(location.pathname);

  useEffect(() => {
    const currentPath = location.pathname;
    
    if (previousPath.current !== currentPath) {
      loggingService.logNavigation(currentPath, previousPath.current);
      previousPath.current = currentPath;
    }
  }, [location]);

  return null;
}
