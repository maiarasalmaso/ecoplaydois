import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-8 overflow-auto font-mono text-sm">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h1 className="text-2xl text-red-500 font-bold border-b border-gray-700 pb-2">
                            Application Crashed
                        </h1>

                        <div className="bg-gray-800 p-4 rounded border border-gray-700">
                            <h2 className="text-gray-400 mb-2 text-xs uppercase tracking-wider">Error Message</h2>
                            <pre className="text-red-300 whitespace-pre-wrap break-words">
                                {this.state.error && this.state.error.toString()}
                            </pre>
                        </div>

                        {this.state.errorInfo && (
                            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                <h2 className="text-gray-400 mb-2 text-xs uppercase tracking-wider">Component Stack</h2>
                                <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-xs">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
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

export default GlobalErrorBoundary;
