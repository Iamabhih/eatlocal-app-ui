import React, { useEffect, useRef } from 'react';
import { loggingService } from '@/services/loggingService';

interface ClickTrackerProps {
  children: React.ReactNode;
  componentName?: string;
}

export function ClickTracker({ children, componentName }: ClickTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Only log clicks on interactive elements
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.role === 'button' ||
        target.onclick !== null
      ) {
        loggingService.logClick(target, componentName);
      }
    };

    container.addEventListener('click', handleClick, true);

    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, [componentName]);

  return <div ref={containerRef}>{children}</div>;
}
