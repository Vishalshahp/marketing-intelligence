import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '40px auto', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#B42318', margin: '0 0 10px 0' }}>Application Render Error</h2>
          <p style={{ color: '#667085', fontSize: '14px' }}>An unexpected error occurred during rendering:</p>
          <pre style={{ background: '#F5F7FB', padding: '15px', borderRadius: '8px', color: '#182230', fontSize: '12px', overflowX: 'auto', border: '1px solid #E2E8F0' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '15px', padding: '8px 16px', background: '#356AE6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
