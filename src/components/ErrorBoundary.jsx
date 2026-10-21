import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          color: '#fff',
          padding: '24px'
        }}>
          <div style={{
            background: '#18181B',
            border: '1px solid #3F3F46',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#EF4444' }}>
              Terjadi Kesalahan Sementara
            </h3>
            <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '16px' }}>
              Komponen modal mengalami masalah teknis kecil. Halaman utama tetap aman.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) this.props.onReset();
              }}
              style={{
                background: '#E50914',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tutup & Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
