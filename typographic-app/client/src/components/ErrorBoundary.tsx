import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: String(err) };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 16 }}>Something went wrong. {this.state.message}</div>;
    }
    return this.props.children;
  }
}
