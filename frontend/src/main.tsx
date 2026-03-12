import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Erro ao renderizar a aplicação
          </h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error.stack ?? this.state.error.message)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
