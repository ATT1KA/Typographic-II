// Lightweight shim that re-exports from Inferno's dist entry and provides safe hook wrappers
import * as coreDist from 'inferno/dist/index.mjs'
import * as core from 'inferno'

export const Component = (coreDist as any).Component
export const memo = (coreDist as any).memo
export const version = (coreDist as any).version
export const Fragment = (props: any) => {
  const impl = (coreDist as any).Fragment
  return impl ? impl(props) : props?.children
}
export const createElement = (...args: any[]) => (coreDist as any).createElement?.(...args)
export const render = (...args: any[]) => (coreDist as any).render?.(...args)
export const createRef = (...args: any[]) => (coreDist as any).createRef?.(...args)
export const cloneElement = (...args: any[]) => (coreDist as any).cloneElement?.(...args)

function missingHook(name: string) {
  return (..._args: any[]) => { throw new Error(`Inferno hook '${name}' is not available in this build of 'inferno'.`) }
}

// Lazy hook wrappers: read from `core` at call-time to avoid TDZ; prefer coreDist first
export const useState = (...args: any[]) => {
  const fn = (coreDist as any).useState ?? (core as any).useState
  return fn ? fn(...args) : missingHook('useState')(...args)
}
export const useEffect = (...args: any[]) => {
  const fn = (coreDist as any).useEffect ?? (core as any).useEffect
  return fn ? fn(...args) : missingHook('useEffect')(...args)
}
export const useRef = (...args: any[]) => {
  const fn = (coreDist as any).useRef ?? (core as any).useRef
  return fn ? fn(...args) : missingHook('useRef')(...args)
}
export const useCallback = (...args: any[]) => {
  const fn = (coreDist as any).useCallback ?? (core as any).useCallback
  return fn ? fn(...args) : missingHook('useCallback')(...args)
}
export const useMemo = (...args: any[]) => {
  const fn = (coreDist as any).useMemo ?? (core as any).useMemo
  return fn ? fn(...args) : missingHook('useMemo')(...args)
}
export const useContext = (...args: any[]) => {
  const fn = (coreDist as any).useContext ?? (core as any).useContext
  return fn ? fn(...args) : missingHook('useContext')(...args)
}
export const useLayoutEffect = (...args: any[]) => {
  const fn = (coreDist as any).useLayoutEffect ?? (core as any).useLayoutEffect
  return fn ? fn(...args) : missingHook('useLayoutEffect')(...args)
}
export const useReducer = (...args: any[]) => {
  const fn = (coreDist as any).useReducer ?? (core as any).useReducer
  return fn ? fn(...args) : missingHook('useReducer')(...args)
}
export const useImperativeHandle = (...args: any[]) => {
  const fn = (coreDist as any).useImperativeHandle ?? (core as any).useImperativeHandle
  return fn ? fn(...args) : missingHook('useImperativeHandle')(...args)
}

// Default export to support `import Inferno from 'inferno'`
const mergedDefault = {
  Component,
  memo,
  version,
  Fragment,
  createElement,
  render,
  createRef,
  cloneElement,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  useLayoutEffect,
  useReducer,
  useImperativeHandle,
}

export default mergedDefault;
