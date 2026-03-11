import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error.message);
        // TODO: Send to error tracking service (Sentry/LogRocket)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9888;&#65039;</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        We're sorry for the inconvenience. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 2rem',
                            background: '#6366f1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem',
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
