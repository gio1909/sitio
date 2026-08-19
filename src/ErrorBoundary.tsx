import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Rede de segurança: sem isso, um erro não tratado em qualquer componente
 * (ex.: falha ao inicializar o Cesium) derruba a árvore inteira do React e a
 * página fica em branco, sem nenhuma pista do que aconteceu.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Erro não tratado na aplicação:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            color: "#eef1f4",
            background: "#0b0d10",
            height: "100vh",
          }}
        >
          <h2>Ocorreu um erro ao carregar o sítio 3D</h2>
          <p>Abra o console do navegador (F12) para ver os detalhes técnicos.</p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff8a75" }}>
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
