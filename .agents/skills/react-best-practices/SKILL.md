---
name: react-best-practices
description: React best practices for components, hooks, state, and performance. Use when writing or reviewing React components, hooks, or when the user mentions React, useState, useEffect, or component patterns. Complements Next.js and Vercel React skills for app-level concerns.
---

# React Best Practices

Apply when writing or reviewing React UI code (with or without Next.js). For Next.js-specific rules and RSC, use the next-best-practices and vercel-react-best-practices skills.

## Components and Structure

- Prefer small, focused components; extract reusable logic into custom hooks.
- Use `'use client'` only where needed (interactivity, browser APIs, or client-only libs); keep server components as default where possible (Next.js).
- Name components in PascalCase; use consistent file names (e.g. `ComponentName.tsx` for the main export).

## State and Data

- Prefer local state first; lift state only when multiple components need it or when it belongs to a clear parent.
- Use the right state type: `useState` for UI state, `useReducer` for complex transitions, context for shallow “theme/locale” style data; avoid context for high-frequency updates.
- Keep state minimal and derived values in `useMemo` only when the computation is expensive and dependencies are stable.

## Hooks

- Follow Rules of Hooks: only call hooks at top level and from React functions; no hooks in conditionals or loops.
- Use `useCallback` for callbacks passed to memoized children or effect deps when referential stability matters; avoid wrapping everything.
- Prefer `useEffect` for sync with external systems (subscriptions, DOM); avoid using it for derived state—compute during render or with `useMemo` instead.
- Clean up in `useEffect` return (subscriptions, timers, listeners) to avoid leaks.

## Performance

- Use `React.memo` for components that re-render often with the same props; ensure props are stable (e.g. with `useCallback`/`useMemo` where needed).
- Prefer keyed lists with stable, unique keys (e.g. id); avoid array index as key when list order can change.
- Lazy-load heavy or below-the-fold components with `React.lazy` and `Suspense`; keep loading boundaries close to the lazy component.

## Accessibility and UX

- Use semantic HTML and ARIA where needed; prefer native elements (button, input, label) over custom divs with click handlers.
- Ensure focus management in modals and dialogs (trap focus, return focus on close).
- Avoid layout shift; reserve space for async content or use skeletons.

## Patterns to Avoid

- Don’t mutate state or props; update with new objects/arrays so React detects changes.
- Avoid prop drilling through many layers; use composition (children, render props) or a small context instead of a single giant context.
- Don’t put non-serializable values (functions, class instances, DOM nodes) in context if the app uses or may use SSR/RSC.
