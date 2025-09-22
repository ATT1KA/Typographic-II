// Broad module shims to ease migration to Inferno. These declare commonly-imported modules
// with permissive `any` exports so we can iteratively port the codebase.

declare module 'inferno' {
  const _default: any;
  export default _default;
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
}

declare module 'inferno-hooks' {
  const anyExport: any;
  export = anyExport;
}

declare module 'react' {
  const _default: any;
  export default _default;
  export const lazy: any;
  export const Suspense: any;
}

declare module 'react-dom' {
  const _default: any;
  export default _default;
}

declare module 'react-dom/client' {
  const anyExport: any;
  export = anyExport;
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const NavLink: any;
  export default any;
}

declare module '@xyflow/react' {
  const anyExport: any;
  export = anyExport;
}

declare module '@testing-library/react' {
  export const render: any;
  export const screen: any;
  export default any;
}
