import { Component, type ReactNode } from "react"

export const ErrorView = ({ message }: { message: string }) => (
  <div className="status-view status-view--error" role="alert">
    <div className="status-view__error-badge" aria-hidden="true">!</div>
    <span className="status-view__message">{message}</span>
  </div>
)

// Storage normalization repairs everything we know how to repair, but a render
// crash it didn't anticipate would otherwise unmount the whole tree and leave
// the new tab blank. This last line of defense degrades to a message instead.
// (Error boundaries are still class-only in React.)
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) {
      return <ErrorView message="Something went wrong while showing your board." />
    }

    return this.props.children
  }
}
