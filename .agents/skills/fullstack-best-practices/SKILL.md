---
name: fullstack-best-practices
description: Fullstack best practices for API design, frontend-backend flow, auth, and data flow. Use when building or reviewing fullstack apps, API contracts, Next.js API routes with backend, or when the user mentions fullstack, API design, or frontend-backend integration.
---

# Fullstack Best Practices

Apply when designing or reviewing fullstack applications (e.g. Next.js + API, React + Node, or similar).

## API and Contract

- Define a clear API contract (REST or tRPC/GraphQL); document request/response shapes and error codes. Prefer OpenAPI or shared types (e.g. TypeScript types imported by frontend and backend).
- Use consistent HTTP semantics: GET idempotent and cacheable; POST for create; PUT/PATCH for update; appropriate status codes (200, 201, 400, 401, 404, 500).
- Version APIs when breaking changes are needed (path prefix or header); avoid breaking changes without a deprecation path.

## Data Flow and Boundaries

- Fetch on the server when possible (RSC, getServerSideProps, route handlers) to avoid extra round-trips and expose less surface to the client.
- Pass only serializable data across the network and between server and client; avoid passing functions or class instances. Use DTOs or shared types for API boundaries.
- Validate and sanitize all input on the backend; never trust client-only validation for security or correctness.

## Auth and Session

- Handle auth on the server (session, JWT validation, or provider callbacks); never rely only on client-side checks for protected resources.
- Use httpOnly, secure cookies for session when applicable; avoid storing tokens in localStorage for sensitive apps unless the pattern is explicit (e.g. B2B with short-lived tokens).
- Prefer established libraries (e.g. NextAuth, Better Auth, Passport) with secure defaults; document any custom auth flow.

## Errors and Loading

- Return structured errors from the API (e.g. `{ error: { code, message } }`); map to user-friendly messages on the frontend.
- Use loading and error boundaries (Suspense, error.tsx, toast) so the UI never shows raw stack traces or hangs indefinitely.
- Log errors and correlation ids on the server; avoid leaking internal details to the client.

## Performance and Caching

- Use caching headers (ETag, Cache-Control) for public or stable data; invalidate or use short TTL where data changes often.
- Prefer one round-trip per view when possible (batch in API or use GraphQL/tRPC batching); avoid N+1 or waterfall requests from the client.
- Consider edge or CDN for static and semi-static content; keep sensitive or dynamic logic on the server.

## Environment and Config

- Use env vars for API base URLs, feature flags, and keys; different values per environment (dev/staging/prod).
- Never expose server-only secrets to the client bundle; use server-side env or API routes to proxy sensitive calls.
