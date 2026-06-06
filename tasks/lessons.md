# Lessons Log

## Lesson 1 — Match the CLI to the pinned framework version
**What happened:** `create-next-app@latest` produced Next 16 + Tailwind v4 + the new
base-ui shadcn, which is incompatible with this project's Next 14 / Tailwind v3 spec.
The latest `shadcn` CLI also emitted Tailwind-v4-only utilities.
**Root cause:** Used `@latest` instead of pinning to the spec's stack.
**Rule going forward:** Pin `create-next-app@14` and the classic `shadcn@2.1.8` CLI.
Tailwind v3 + classic Radix components are the supported baseline here.

## Lesson 2 — Tailwind v3 colour tokens must be HSL triplets
**What happened:** A stray shadcn step left `globals.css` with oklch values while the
config used `hsl(var(--token))`, breaking every themed colour.
**Root cause:** Mixed v4 (oklch) tokens with a v3 (`hsl(var())`) config.
**Rule going forward:** In this project, `:root` tokens are space-separated HSL
triplets (e.g. `--primary: 274 67% 39%`) consumed via `hsl(var(--primary))`.

## Lesson 7 — Supabase insert returns a query builder, not a Promise with .catch()
**What happened:** Used `.catch(() => null)` on a Supabase `.insert()` call. TypeScript (and Supabase's types) don't expose `.catch()` on the query builder.
**Root cause:** Supabase query builders are thenables but don't expose `.catch()` directly on the type.
**Rule going forward:** Always wrap Supabase calls in `try { await ... } catch { /* non-critical */ }` blocks instead of chaining `.catch()`.

## Lesson 6 — @react-pdf/renderer renderToBuffer type conflict with React elements
**What happened:** `renderToBuffer(React.createElement(...))` caused TS2345 because the element type doesn't match `ReactElement<DocumentProps>`.
**Root cause:** `@react-pdf/renderer` uses its own JSX types that don't perfectly align with React's.
**Rule going forward:** Use `require("@react-pdf/renderer")` instead of the ESM import for `renderToBuffer` to bypass the type conflict. This is the standard workaround for this library.

## Lesson 5 — Set spread requires --downlevelIteration or es2015 target
**What happened:** `[...mySet]` in a client component caused TS2802.
**Root cause:** TypeScript's spread of iterables requires explicit `downlevelIteration` or ES2015+ target.
**Rule going forward:** Always use `Array.from(mySet)` instead of `[...mySet]` to spread Sets/Maps — it works at all targets.

## Lesson 4 — Exclude standalone scripts from tsconfig
**What happened:** Test scripts in scripts/ used top-level `const` declarations.
TypeScript treated all files as one global scope (no `export {}`) and reported
"Cannot redeclare block-scoped variable" across files.
**Root cause:** tsconfig `include` was `**/*.ts` which caught the scripts dir.
**Rule going forward:** Add `"scripts"` to tsconfig `exclude` for any directory
containing standalone node scripts that are not part of the Next.js app.

## Lesson 3 — framer-motion v12 needs literal easing
**What happened:** `ease: "easeOut"` typed as `string` failed the build.
**Rule going forward:** Type variants as `Variants` and use `ease: "easeOut" as const`.
