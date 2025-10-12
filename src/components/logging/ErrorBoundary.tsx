import React, { Component, ErrorInfo, ReactNode } from 'react';
import { loggingService } from '@/services/loggingService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    loggingService.logError({
      error_type: 'React Error',
      error_message: error.message,
      stack_trace: error.stack || errorInfo.componentStack,
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      severity: 'high',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                An unexpected error occurred. This has been logged and we'll look into it.
              </p>
              {this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-muted rounded">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleReset} variant="outline">
                Reload Application
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
