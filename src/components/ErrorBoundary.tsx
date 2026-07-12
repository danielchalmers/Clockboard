import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered in place of the children when a descendant render throws. */
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// A single bad widget must not take the whole new tab down with it. If a card
// throws while rendering (e.g. a corrupted imported board, or a value the code
// didn't anticipate), this catches it and shows a calm fallback instead of an
// unmounted, blank page — the header and its recovery controls stay usable.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // No analytics or network — just leave a breadcrumb in the console.
    console.error("Dayboard caught a render error:", error, info.componentStack)
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
