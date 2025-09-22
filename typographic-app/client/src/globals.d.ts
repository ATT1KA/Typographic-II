declare const Inferno: any;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface ImportMetaEnv {
  VITE_INFERNO_COMPAT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'inferno' {
  export const Fragment: any;
  export const createElement: any;
  export const render: any;
  export const Component: any;
  export const createRef: any;
  export const cloneElement: any;
  export const memo: any;
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useCallback: any;
  export const useMemo: any;
  export const useContext: any;
  export const useLayoutEffect: any;
  export const useReducer: any;
  export const useImperativeHandle: any;
  export const version: any;
  const _default: any;
  export default _default;
}

declare module 'inferno-hooks' {
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useCallback: any;
  export const useMemo: any;
  export const useLayoutEffect: any;
  export const useReducer: any;
  export default any;
}
