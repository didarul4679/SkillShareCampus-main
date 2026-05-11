import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {this.props.fallbackMessage || "Something went wrong"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We encountered an unexpected error. Please try again.
                  </p>
                </div>

                {this.state.error && (
                  <details className="w-full text-left">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      Error details
                    </summary>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-xs font-mono text-foreground break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="text-xs mt-2 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                    disabled={this.state.retryCount >= 3}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {this.state.retryCount >= 3 ? "Max retries reached" : "Try Again"}
                  </Button>
                  <Link to="/campus" className="flex-1">
                    <Button variant="outline" className="w-full" onClick={this.handleReset}>
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </Link>
                </div>

                {this.state.retryCount >= 2 && (
                  <p className="text-xs text-muted-foreground">
                    If the problem persists, try refreshing the page or contact support.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}