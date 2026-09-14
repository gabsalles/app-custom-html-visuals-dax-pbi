// components/ErrorBoundary.tsx
//
// Fix da tela branca em produção (deploy Vercel): um crash não-tratado
// durante a renderização (ex.: estado salvo no localStorage incompatível
// com o schema atual) deixava a árvore inteira sem montar, sem nenhuma
// mensagem — só <div id="root"></div> vazio, repetindo em todo refresh
// porque o dado ruim continuava salvo. Este Error Boundary é a rede de
// segurança: qualquer erro de renderização abaixo dele mostra uma tela
// com o erro + um botão pra limpar o estado salvo e recarregar, em vez de
// branco mudo. Precisa ser um componente de classe — Error Boundaries
// ainda não têm equivalente em hooks no React.

import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('DAXILIZER — erro não tratado na renderização:', error, info.componentStack);
  }

  handleResetData = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Falha ao limpar localStorage:', e);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Inter', -apple-system, sans-serif", background: '#f3f4f6',
      }}>
        <div style={{
          maxWidth: 480, width: '100%', background: '#ffffff', borderRadius: 16,
          padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1D1D1F', marginBottom: 8 }}>
            Algo deu errado ao carregar o DAXILIZER
          </h1>
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
            Isso geralmente acontece quando dados salvos no seu navegador ficaram
            incompatíveis com uma atualização recente do app. Limpar os dados salvos
            e recarregar costuma resolver.
          </p>
          <button
            onClick={this.handleResetData}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: '#4f46e5', color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', marginBottom: 12,
            }}
          >
            Limpar dados salvos e recarregar
          </button>
          <details style={{ textAlign: 'left', fontSize: 10, color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer', marginBottom: 6 }}>Detalhes técnicos</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
