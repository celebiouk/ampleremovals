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

## Lesson 3 — framer-motion v12 needs literal easing
**What happened:** `ease: "easeOut"` typed as `string` failed the build.
**Rule going forward:** Type variants as `Variants` and use `ease: "easeOut" as const`.
