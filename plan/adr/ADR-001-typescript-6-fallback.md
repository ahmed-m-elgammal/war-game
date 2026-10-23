# ADR-001: TypeScript 6.x Fallback for Toolchain Compatibility

- **Status:** Approved (conforming to `plan/04` §3.1 and decision `D-037`)
- **Date:** 2026-10-23
- **Author:** Tech Lead / Antigravity

## Context

Task `P1-E1-T3` and `P1-E1-T4` establish the project's toolchain and linting quality gates. While `typescript@7.0.2` compiles the workspace skeleton with zero errors, `typescript-eslint@8.72.0` strictly enforces peer dependencies of `>=4.8.4 <6.1.0` and refuses to parse TypeScript 7.0 ASTs with:
> `Error: typescript-eslint does not support TS 7.0. See tracking issue #10940 for support for TS >=7.1`

`plan/04-technology-decisions.md` §3.1 explicitly anticipated this condition:
> *"If a required dependency cannot typecheck under TS 7, the fallback is the latest compatible TypeScript 6.x line, recorded as an ADR. Do not mix compiler versions across packages."*

## Decision

Fall back compiler version across the entire workspace from `7.0.2` to **`typescript@6.0.3`** (the latest compatible 6.x release).

## Alternatives Considered

1. **Disable `typescript-eslint` on TS 7:** Rejected. Violates `AGENTS.md` §11 and definition of done requiring strict ESLint flat config on all code.
2. **Use `@babel/eslint-parser`:** Rejected. Introduces unnecessary Babel tooling complexity and loses typed linting rules.
3. **TypeScript 6.0.3 fallback:** Approved. Both `tsc -b` and `eslint .` pass with zero errors, satisfying all acceptance criteria.

## Consequences

- All workspace packages and applications use the exact same TypeScript 6.0.3 compiler.
- ESLint 9 flat config, Prettier 3.9, and Vitest 5.0 run cleanly without AST incompatibilities.
- The root `package.json` pins `"typescript": "6.0.3"`.

## Rollback / Future Upgrade Plan

Once `typescript-eslint` publishes official support for TypeScript 7 AST parsing, an upgrade ticket can be filed to bump the workspace back to TypeScript 7.x.
