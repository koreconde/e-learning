import { Component, ReactNode } from "react";

type State = { error: Error | null };

export class AdminErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[AdminErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-lg w-full border rounded-lg p-6 bg-card">
            <h1 className="text-xl font-bold mb-2 text-destructive">Errore nella dashboard</h1>
            <p className="text-sm text-muted-foreground mb-3">
              Si è verificato un errore. Inviare questo messaggio al team tecnico:
            </p>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              className="mt-4 text-sm underline"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              Ricarica
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}