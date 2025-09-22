// Minimal declaration for `inferno/hooks` used by the shim and the app.
// Keep this narrow to avoid masking real typing issues — expand if you need more precise types.

declare module 'inferno/hooks' {
  export function useState<S>(initial?: S | (() => S)): [S, (v: S | ((s: S) => S)) => void]
  export function useEffect(effect: () => void | (() => void | undefined), deps?: any[]): void
  export function useRef<T = any>(initial?: T): { current: T }
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T
  export function useMemo<T>(fn: () => T, deps: any[]): T
  export function useContext<T>(context: any): T
  export function useLayoutEffect(effect: () => void | (() => void | undefined), deps?: any[]): void
  export function useReducer<R, I = any, A = any>(reducer: any, initial: I, init?: any): [R, (a: A) => void]
  export function useImperativeHandle(ref: any, init: () => any, deps?: any[]): void

  // Re-export anything else as `any` to keep things flexible
  const _default: any
  export default _default
}
