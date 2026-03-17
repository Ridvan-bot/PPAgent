---
name: testing-best-practices
description: Testing best practices for unit, integration, and E2E tests. Use when writing or reviewing tests, setting up Jest, Vitest, React Testing Library, Playwright, or when the user mentions testing, TDD, or test coverage.
---

# Testing Best Practices

Apply when adding or reviewing tests in TypeScript/JavaScript, React, or Node.js projects.

## What to Test

- Focus on behavior and outcomes, not implementation; avoid testing internal state or private functions unless necessary for complex logic.
- Prefer testing public API (components, functions, endpoints); use unit tests for pure logic and edge cases, integration tests for flows that touch DB/API.
- Cover critical paths and error cases; avoid testing the framework or third-party code.

## Unit and Component Tests

- Use React Testing Library for React; query by role, label, or test-id; avoid relying on class names or DOM structure when possible.
- Prefer user-centric actions (click, type, submit); avoid testing implementation details (state variables, internal methods).
- Mock external dependencies (API, DB) at the boundary; use MSW or similar for consistent request/response in tests.
- Keep tests isolated: no shared mutable state, no order dependency; use beforeEach/afterEach for setup and cleanup.

## Integration and API Tests

- Test real HTTP endpoints with a test DB or in-memory store; run migrations or seed data in a known state.
- Use one test database or transaction rollback per test so runs are repeatable and parallel-safe when possible.
- Assert on response status, body shape, and side effects (e.g. DB state); avoid asserting on implementation details.

## E2E Tests

- Use few, stable E2E tests for critical user journeys; prefer Playwright or Cypress with clear selectors and waits.
- Prefer data attributes (e.g. `data-testid`) for stable selectors over brittle CSS or text that changes with copy.
- Use explicit waits or built-in auto-waiting; avoid fixed sleeps. Keep E2E suite fast enough to run in CI (parallel, trimmed scope).

## Structure and Naming

- Place tests next to code (`Component.test.tsx`) or in a mirrored `__tests__` structure; follow project convention.
- Name tests by scenario and expected outcome: e.g. "renders empty state when no items" or "returns 401 when token is missing".
- Use describe/it (or test) with clear nesting; avoid deep nesting that obscures intent.

## Test Data and Mocks

- Use factories or builders for test data so tests stay readable and easy to vary (e.g. one valid user, one invalid).
- Keep mocks close to the test; prefer dependency injection or test doubles over global mocks when possible.
- Snapshot only when the output is stable and meaningful; prefer explicit assertions for critical behavior; avoid large or noisy snapshots.

## CI and Coverage

- Run tests in CI on every push; fail the pipeline on test failure. Use coverage as a guide, not a target—focus on important paths.
- Keep tests fast: mock I/O, use in-memory stores, and run E2E in parallel or on a schedule if needed.
- Flaky tests: fix or quarantine; avoid ignoring without a ticket or timeline to fix.
