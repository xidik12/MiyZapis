// ============================================================
// Typed Redux Hooks — Shared between frontend and mini-app
// Both apps use identical code: useAppDispatch + useAppSelector
//
// Usage: Each app still needs its own store/index.ts that exports
// RootState and AppDispatch. This file provides the typed hooks.
//
// NOTE: This file uses generic types. Each app should create a
// local re-export that pins the types to its own store:
//
// // app/hooks/redux.ts
// import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
// import type { RootState, AppDispatch } from '@/store';
// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// ============================================================

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

/**
 * Create typed Redux hooks for a specific store.
 * Call this once per app with your store's types.
 *
 * Example:
 * ```ts
 * import { createTypedHooks } from '@shared/hooks/useRedux';
 * import type { RootState, AppDispatch } from './store';
 * export const { useAppDispatch, useAppSelector } = createTypedHooks<RootState, AppDispatch>();
 * ```
 */
export function createTypedHooks<TRootState, TAppDispatch extends (...args: any[]) => any>() {
  const useAppDispatch = () => useDispatch<TAppDispatch>();
  const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;
  return { useAppDispatch, useAppSelector };
}
