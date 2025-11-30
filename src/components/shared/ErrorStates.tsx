import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  Home,
  ArrowLeft,
  WifiOff,
  ServerCrash,
  FileQuestion,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  className?: string;
}

interface ErrorAlertProps {
  title?: string;
  message: string;
  variant?: 'default' | 'destructive';
  onDismiss?: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic error state component
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  className,
}: ErrorStateProps) {
  const navigate = useNavigate();

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {showBackButton && (
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Network/offline error state
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Internet Connection</h2>
        <p className="text-muted-foreground mb-6">
          Please check your internet connection and try again.
        </p>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Server error state (500 errors)
 */
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <ServerCrash className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Server Error</h2>
        <p className="text-muted-foreground mb-6">
          Our servers are having trouble right now. Please try again in a few moments.
        </p>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Not found error state (404 errors)
 */
export function NotFoundError({
  resource = 'page',
  onBack,
}: {
  resource?: string;
  onBack?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The {resource} you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Access denied error state (403 errors)
 */
export function AccessDeniedError() {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this resource.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Rate limit exceeded error
 */
export function RateLimitError({ retryAfter }: { retryAfter?: number }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
          <Ban className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Too Many Requests</h2>
        <p className="text-muted-foreground mb-6">
          You've made too many requests. Please wait{' '}
          {retryAfter ? `${retryAfter} seconds` : 'a moment'} before trying again.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Inline error alert
 */
export function ErrorAlert({ title, message, variant = 'destructive', onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant={variant}>
      <AlertCircle className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty state component
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6 text-center">
        {icon && (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground mb-6">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick}>{action.label}</Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Form error message component
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

/**
 * Get appropriate error component based on error type
 */
export function getErrorComponent(error: unknown, onRetry?: () => void) {
  if (!error) return null;

  // Check for common error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return <NetworkError onRetry={onRetry} />;
    }

    if (message.includes('not found') || message.includes('404')) {
      return <NotFoundError />;
    }

    if (message.includes('forbidden') || message.includes('403') || message.includes('unauthorized')) {
      return <AccessDeniedError />;
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return <RateLimitError />;
    }

    if (message.includes('server') || message.includes('500')) {
      return <ServerError onRetry={onRetry} />;
    }
  }

  // Default error state
  return (
    <ErrorState
      message={error instanceof Error ? error.message : 'An unexpected error occurred'}
      onRetry={onRetry}
    />
  );
}
