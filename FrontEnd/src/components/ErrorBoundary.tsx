import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          margin: '20px',
          color: '#721c24'
        }}>
          <h2>⚠️ Có lỗi xảy ra</h2>
          <p>Đã xảy ra lỗi khi tải trang admin. Vui lòng thử lại.</p>
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            <summary>Chi tiết lỗi</summary>
            <pre style={{ 
              backgroundColor: '#f1f1f1', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={this.resetError}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
