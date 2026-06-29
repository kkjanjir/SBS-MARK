## 2026-06-29 - [Unit Testing with Node 22]
**Learning:** Node 22's built-in test runner (`node --test`) combined with `--experimental-strip-types` allows running TypeScript tests directly without a separate build step, provided that imports use the `.ts` extension or the environment is correctly configured.
**Action:** Use `node --experimental-strip-types --test` for quick unit testing of pure logic files in TypeScript projects where a full test framework (like Jest/Vitest) is not yet set up.
