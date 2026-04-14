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
    console.error('ErrorBoundary:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    const layout = this.props.layout === 'embedded' ? 'embedded' : 'fullscreen';

    if (this.state.hasError) {
      const shellClass =
        layout === 'embedded'
          ? 'flex flex-1 items-center justify-center px-4 py-16 font-sans'
          : 'min-h-screen flex items-center justify-center px-4 font-sans';

      return (
        <div className={shellClass} style={{ backgroundColor: 'var(--skin-cream)' }}>
          <div className="max-w-md w-full p-8 rounded-2xl border shadow-lg bg-white border-stone-100 text-center">
            <h1 className="text-xl font-display font-semibold text-stone-800 mb-2">
              Něco se pokazilo
            </h1>
            <p className="text-stone-600 text-sm mb-6">
              Omlouváme se, aplikace narazila na chybu. Zkuste stránku obnovit.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-widest transition-all text-stone-700 bg-stone-100 hover:bg-stone-200 mr-2"
            >
              Zkusit znovu
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-widest transition-all text-white bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95"
            >
              Obnovit stránku
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
