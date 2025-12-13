import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

type Props = React.PropsWithChildren<{ onReset?: () => void }>;

export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // log to console or a logging service
    console.error('ErrorBoundary caught an error', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="w-full max-w-lg bg-popover text-popover-foreground rounded-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Ocorreu um erro</h3>
            <p className="text-sm text-muted-foreground mt-2">Desculpe — tivemos um problema ao abrir esse componente. Você pode fechar e tentar novamente.</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={this.reset}>Fechar</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
