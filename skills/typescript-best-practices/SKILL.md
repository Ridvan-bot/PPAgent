---
name: typescript-best-practices
description: TypeScript best practices for typing, strict mode, generics, and patterns. Use when writing or reviewing TypeScript code, adding types to JavaScript, or when the user mentions TypeScript, types, or tsconfig.
---

# TypeScript Best Practices

Apply when writing or reviewing TypeScript in Node.js, Next.js, or React projects.

## Strictness

- Prefer `strict: true` (or equivalent: `strictNullChecks`, `noImplicitAny`). Avoid `any`; use `unknown` and narrow, or `type`/`interface` with proper definitions.
- Use `satisfies` for inferred-but-validated types (e.g. config objects) to keep inference while enforcing shape.
- Prefer `interface` for object shapes that may be extended; use `type` for unions, intersections, and mapped types.

## Types vs Assertions

- Prefer typing function parameters and return types explicitly for public APIs and exports.
- Use `as const` for literal narrowing; avoid `as` type assertions unless necessary (e.g. after runtime checks). Prefer type guards and narrowing instead of `as`.
- Avoid `@ts-ignore`; use `@ts-expect-error` with a short comment when a known type error is temporary.

## Generics and Reuse

- Use generics for reusable functions and components; constrain with `extends` where needed.
- Prefer `Record<string, unknown>` or specific key types over `object` or `{}` for “plain object” types.
- Use utility types: `Partial<T>`, `Pick<T,K>`, `Omit<T,K>`, `Required<T>`, `ReturnType<typeof fn>` instead of manual duplication.

## Async and Errors

- Prefer `Promise<T>` return types for async functions; use `async/await` over raw `.then()` for readability.
- Type `catch` as `unknown` and narrow (e.g. `instanceof Error`) before using; avoid empty catch or broad `any`.

## Project and Imports

- Use path aliases in `tsconfig` (e.g. `@/`) for cleaner imports; keep consistent with project conventions.
- Prefer `import type` for type-only imports to aid tree-shaking and clarity.
- Use `enum` sparingly; prefer union types or const objects with `as const` when possible.

## Naming and Structure

- Suffix types/interfaces used as “brands” or IDs with `Id` or similar (e.g. `UserId`); use nominal typing only when needed.
- Keep `.d.ts` files for ambient declarations; put implementation types in normal `.ts` files.
- Prefer small, focused type files or colocated types; avoid single huge “types” barrels unless the project convention uses them.
