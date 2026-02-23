"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Captura erros de renderização em componentes filhos e exibe um fallback
 * em vez de deixar a aplicação inteira travar.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-svh flex-col items-center justify-center gap-4 p-4 text-center">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocorreu um erro inesperado. Por favor, recarregue a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
