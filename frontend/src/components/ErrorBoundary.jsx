import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container mt-xl text-center">
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 className="mb-md">Oops! Something went wrong</h2>
                        <p className="text-secondary mb-lg">
                            An error occurred while rendering this page:
                            <code style={{ display: 'block', background: '#f8fafc', padding: '1rem', marginTop: '1rem', borderRadius: '8px', color: '#e11d48' }}>
                                {this.state.error?.message || 'Unknown error'}
                            </code>
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
