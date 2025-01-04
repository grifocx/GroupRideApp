import React from 'react';
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private refreshPage = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = '/';
    this.resetError();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-destructive/10 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </AlertDescription>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={this.refreshPage}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.goHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}