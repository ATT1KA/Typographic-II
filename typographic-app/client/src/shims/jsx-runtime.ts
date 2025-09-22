// Shim for React 17+ automatic JSX runtime, backed by inferno-compat
import React from 'inferno-compat';

const Fragment = React.Fragment as unknown as symbol;

function normalizeProps<P extends Record<string, any>>(props: P | null | undefined, key: any) {
  if (key !== undefined && key !== null) {
    props = props ? { ...props, key } : ({ key } as any);
  }
  return props as P;
}

export function jsx(type: any, props: any, key?: any) {
  return (React as any).createElement(type, normalizeProps(props, key));
}

export function jsxs(type: any, props: any, key?: any) {
  return (React as any).createElement(type, normalizeProps(props, key));
}

export { Fragment };

// Optional jsxDEV for dev builds; Vite may reference it in dev
export function jsxDEV(type: any, props: any, key?: any) {
  return (React as any).createElement(type, normalizeProps(props, key));
}
