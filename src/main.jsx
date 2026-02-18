import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Georgia, serif', maxWidth: '600px', margin: '4rem auto', color: '#2B2B2B' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>☦</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Error</h1>
          <p style={{ color: '#8A8278', marginBottom: '1rem' }}>Something went wrong while loading the app.</p>
          <pre style={{ background: '#EDE8DC', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#B8860B', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
