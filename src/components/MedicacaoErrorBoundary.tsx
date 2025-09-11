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
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isDataError = error.message.includes('medication') || 
                       error.message.includes('convert') || 
                       error.message.includes('parseInt') ||
                       error.message.includes('NaN');
    
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    
    console.error('MedicacaoErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: error.name,
      isDataError,
      isMobile,
      timestamp: new Date().toISOString()
    })
    
    // Log additional mobile debugging info
    if (typeof window !== 'undefined') {
      console.error('Mobile debugging info:', {
        userAgent: navigator.userAgent,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        url: window.location.href,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      })
    }
    
    // Auto-recovery for data conversion errors
    if (isDataError && isMobile) {
      console.log('Attempting auto-recovery for mobile data conversion error...');
      setTimeout(() => {
        console.log('Auto-recovery: Resetting error boundary state');
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }, 1500);
    }
    
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