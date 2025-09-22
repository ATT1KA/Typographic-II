// React compatibility shim backed by inferno + inferno-compat
import * as Inferno from 'inferno';
import InfernoCompatDefault, * as InfernoCompat from 'inferno-compat';

// Named re-exports commonly used by React code
export const {
  Children,
  Component,
  Fragment,
  createElement,
  cloneElement,
  isValidElement,
  createRef,
  createFactory,
  version,
} = (InfernoCompat as any);

// Hooks and modern APIs: map to Inferno's implementations where available
export const useState = (Inferno as any).useState;
export const useEffect = (Inferno as any).useEffect;
export const useRef = (Inferno as any).useRef;
export const useMemo = (Inferno as any).useMemo;
export const useCallback = (Inferno as any).useCallback;
export const useReducer = (Inferno as any).useReducer;
export const useContext = (Inferno as any).useContext;
export const useLayoutEffect = (Inferno as any).useLayoutEffect;

// Also export compat named exports
export * from 'inferno-compat';

// Minimal Suspense implementation: render children directly (fallback ignored)
export const Suspense = ({ children }: { children: any }) => children;

// Minimal lazy implementation: return a component that loads the module on mount
export function lazy(loader: () => Promise<{ default: any }>) {
  const BaseComponent: any = Component as any;

  return class LazyWrapper extends BaseComponent {
    state: { C: any } = { C: null };

    componentDidMount() {
      loader().then(mod => {
        this.setState({ C: mod.default || mod });
      }).catch(() => {});
    }

    render() {
      const C = this.state.C;
      if (!C) return null;
      return (C as any)(this.props);
    }
  } as any;
}

// createContext: prefer inferno-compat/createContext, fallback to inferno, otherwise provide a minimal shim
export const createContext = (InfernoCompat as any).createContext || (Inferno as any).createContext || function createContextShim(defaultValue: any) {
  const ctx: any = {
    _default: defaultValue,
    Provider(props: any) {
      return props.children;
    },
    Consumer(props: any) {
      return props.children(defaultValue);
    }
  };
  return ctx;
};

// memo: simple passthrough
export const memo = (InfernoCompat as any).memo || ((c: any) => c);

// Attach helpers onto default export (so React.default.memo etc. works)
try {
  if (InfernoCompatDefault && typeof InfernoCompatDefault === 'object') {
    const def: any = InfernoCompatDefault as any;
    def.memo = (InfernoCompat as any).memo || memo;
    def.createContext = (InfernoCompat as any).createContext || createContext;
    def.Suspense = (InfernoCompat as any).Suspense || Suspense;
    def.lazy = (InfernoCompat as any).lazy || lazy;
    def.useState = def.useState || useState;
    def.useEffect = def.useEffect || useEffect;
    def.useRef = def.useRef || useRef;
    def.useMemo = def.useMemo || useMemo;
    def.useCallback = def.useCallback || useCallback;
    def.useReducer = def.useReducer || useReducer;
    def.useContext = def.useContext || useContext;
    def.useLayoutEffect = def.useLayoutEffect || useLayoutEffect;
    def.Children = def.Children || Children;
    def.createElement = def.createElement || createElement;
    def.createRef = def.createRef || createRef;
    def.Fragment = def.Fragment || Fragment;
    def.Component = def.Component || Component;
    def.version = def.version || version;
  }
} catch (e) {}

// Ensure named exports are also available from default export at runtime for CommonJS consumers
// Build a stable default export object that always exposes the React API surface
const ReactDefault: any = InfernoCompatDefault;

// Ensure runtime properties exist on the default object (attach to function if it is one)
(ReactDefault as any).memo = (InfernoCompat as any).memo || memo;
(ReactDefault as any).createContext = (InfernoCompat as any).createContext || createContext;
(ReactDefault as any).Suspense = (InfernoCompat as any).Suspense || Suspense;
(ReactDefault as any).lazy = (InfernoCompat as any).lazy || lazy;
(ReactDefault as any).useState = (InfernoCompat as any).useState || useState;
(ReactDefault as any).useEffect = (InfernoCompat as any).useEffect || useEffect;
(ReactDefault as any).useRef = (InfernoCompat as any).useRef || useRef;
(ReactDefault as any).useMemo = (InfernoCompat as any).useMemo || useMemo;
(ReactDefault as any).useCallback = (InfernoCompat as any).useCallback || useCallback;
(ReactDefault as any).useReducer = (InfernoCompat as any).useReducer || useReducer;
(ReactDefault as any).useContext = (InfernoCompat as any).useContext || useContext;
(ReactDefault as any).useLayoutEffect = (InfernoCompat as any).useLayoutEffect || useLayoutEffect;
(ReactDefault as any).Children = (InfernoCompat as any).Children || Children;
(ReactDefault as any).createElement = (InfernoCompat as any).createElement || createElement;
(ReactDefault as any).createRef = (InfernoCompat as any).createRef || createRef;
(ReactDefault as any).Fragment = (InfernoCompat as any).Fragment || Fragment;
(ReactDefault as any).Component = (InfernoCompat as any).Component || Component;
(ReactDefault as any).version = (InfernoCompat as any).version || version;

export default ReactDefault;
export { ReactDefault };
