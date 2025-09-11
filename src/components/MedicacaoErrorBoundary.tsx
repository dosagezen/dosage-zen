import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: string
}

class MedicacaoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch truly critical errors
    const isCriticalError = error.message.includes('Cannot read') || 
                           error.message.includes('undefined') ||
                           error.name === 'ChunkLoadError' ||
                           error.stack?.includes('convertToMedicacaoCompleta') ||
                           error.message.includes('NetworkError') ||
                           error.message.includes('Failed to fetch');
    
    if (!isCriticalError) {
      console.warn('Non-critical error, allowing normal error handling:', error.message);
      return { hasError: false };
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ser mais seletivo sobre quais erros capturar
    const isCriticalError = error.message.includes('Cannot read') || 
                           error.message.includes('undefined') ||
                           error.name === 'ChunkLoadError' ||
                           error.stack?.includes('convertToMedicacaoCompleta');
    
    // Só capturar erros críticos relacionados a medicações
    if (!isCriticalError) {
      console.warn('Non-critical error caught by boundary, allowing normal error handling:', error.message);
      return;
    }
    
    console.error('Critical error caught by MedicacaoErrorBoundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: error.name,
      timestamp: new Date().toISOString()
    })
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    window.location.reload()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-lg font-semibold text-destructive">
                  Erro na página de medicações
                </h2>
                <p className="text-muted-foreground text-sm">
                  Algo deu errado ao carregar a página. Tente recarregar ou entre em contato conosco.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left text-xs bg-muted p-2 rounded">
                    <summary className="cursor-pointer font-medium mb-2">
                      Detalhes do erro (desenvolvimento)
                    </summary>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={this.handleRetry} variant="outline">
                    Tentar Novamente
                  </Button>
                  <Button onClick={this.handleReload} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recarregar Página
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default MedicacaoErrorBoundary