import type { Component, VNode } from 'inferno'

declare global {
  namespace JSX {
    interface Element extends VNode<any> {}
    interface ElementClass extends Component<any, any> {
      render(): VNode<any> | null
    }
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}