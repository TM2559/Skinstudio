import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 py-16">
            <h2 className="font-display text-xl font-bold text-stone-800 mb-2">Něco se pokazilo</h2>
            <p className="text-sm text-stone-500 mb-6">Zkuste obnovit stránku.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
            >
              Obnovit stránku
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
