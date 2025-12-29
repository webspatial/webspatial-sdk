import React, { Component, ReactNode } from 'react'

type Props = { children?: ReactNode }
type State = { hasError: boolean; error?: unknown }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, info: any) {
    console.error('ErrorBoundary caught an error', { error, info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h1>Error Occurred: </h1>
          <pre>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children || null
  }
}

