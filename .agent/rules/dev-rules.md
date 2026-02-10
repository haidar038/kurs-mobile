---
trigger: always_on
---

# Antigravity Agent Rules

## 1. Core Principle: Token-Efficient Output

- Produce **concise, structured, and actionable** responses.
- Avoid unnecessary long explanations.
- Default output format:
    - Step-by-step checklist
    - Minimal code snippets when needed
    - No large file dumps unless explicitly requested

---

## 2. Development Environment Standard

### Runtime & Package Manager

- Base runtime: **Bun**
- Main package manager: **bun**
- Main tool runner: **bunx**

The agent must not recommend npm/yarn/pnpm unless explicitly requested.

---

## 3. Installation Policy (Manual Only)

- Agent must never auto-install packages.
- Provide clear manual install commands only, e.g.:

```bash
bun add package-name
```

- Do not state or imply that installations were executed.

---

## 4. Testing Policy (Manual Execution)

- Agent does not run tests.
- Provide test commands and guidance only, e.g.:

```bash
bun test
bunx vitest
bunx playwright test
```

---

## 5. Code Generation Rules (TypeScript-first)

### 5.1 General rules

- Project uses **TypeScript**. Agent must **always** produce TypeScript code when generating source files.
- All variables, function parameters, return values, props, state, and API response shapes **must have explicit types**. Avoid implicit `any`.
- Agent must **never** use the `any` type in generated code. If a type is unknown, prefer `unknown` or a generic placeholder (`T`) and add a `// TODO` comment explaining required shape.
- Prefer explicit `interface` or `type` definitions for domain models (e.g., `User`, `PickupRequest`, `DepositRecord`, `Facility`).
- Provide DTO (data transfer object) types for API request/response payloads and map them to DB row types.
- For client code that interacts with third-party APIs or ML models, include runtime validation suggestions (e.g., Zod schemas) and example usage.

### 5.2 Type-system enforcement (configs)

When suggesting project config, always recommend the following TypeScript & ESLint settings:

**tsconfig.json (recommended flags)**

```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "exactOptionalPropertyTypes": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "target": "es2022",
        "module": "esnext"
    }
}
```

**ESLint rules (recommended)**

- `@typescript-eslint/no-explicit-any: "error"`
- `@typescript-eslint/explicit-module-boundary-types: ["warn"]`
- `@typescript-eslint/consistent-type-definitions: ["error", "interface"]`

Agent should show these snippets whenever creating or editing project-level config.

### 5.3 When uncertain about a type

- Use `unknown` instead of `any` and show a minimal validation example:

```ts
type ApiResponse = unknown;

// example conversion with validation
import { z } from "zod";
const UserSchema = z.object({ id: z.string(), name: z.string() });
const parsed = UserSchema.safeParse(ApiResponse);
if (!parsed.success) throw new Error("Unexpected API response");
const user: User = parsed.data;
```

- Alternatively use a generic type placeholder with a TODO:

```ts
type TApi = T; // TODO: replace T with actual type
```

### 5.4 Examples (enforced patterns)

**Domain model**

```ts
export interface User {
    id: string;
    name: string;
    phone?: string;
    role: UserRole;
    createdAt: string; // ISO date
}
```

**Enum for roles (DB-aligned)**

```ts
export type UserRole = "guest" | "user" | "collector" | "waste_bank_staff" | "facility_admin" | "operator" | "support" | "admin";
```

**API response typing with validation**

```ts
import { z } from "zod";

const PickupSchema = z.object({
    id: z.string(),
    userId: z.string(),
    location: z.object({ lat: z.number(), lng: z.number() }),
    status: z.enum(["requested", "assigned", "en_route", "completed"]),
});
type Pickup = z.infer<typeof PickupSchema>;

async function fetchPickup(id: string): Promise<Pickup> {
    const res = await fetch(`/api/pickups/${id}`);
    const json = await res.json();
    const parsed = PickupSchema.parse(json);
    return parsed;
}
```

---

## 6. Supabase & Migrations (manual commands)

- Always produce migration commands using `bunx supabase migration new [name]`.
- When emitting SQL DDL or migration content, include explicit types and align enum values with TypeScript `UserRole` type.
- Agent should generate example migration SQL with proper type definitions and `ALTER TABLE` steps when requested.

Example migration creation guidance:

```bash
bunx supabase migration new add_user_role_enum
# then edit migration SQL to add enum type and alter column type
# after edit:
bunx supabase db push
```

---

## 7. Workflow Style (Step-by-Step Guidance)

Every response with implementation steps must include:

1. What to change
2. Files to edit/create
3. Commands the user must run manually
4. Short expected results

Minimal template:

- Goal: one-sentence objective
- Files: list
- Commands: list (manual)
- Verification: quick checks

---

## 8. Dependency Discipline

- Recommend dependencies only when necessary, justify briefly.
- Provide `bun add` command and minimal usage example.
- Do not suggest installing global tools unless explicitly requested.

---

## 9. Consistency Enforcement

- Maintain consistent naming, typing, and command style (`bun`/`bunx` only).
- Use `camelCase` for JS/TS variables and `PascalCase` for React components and interfaces.

---

## 10. Quick Agent Response Template (TypeScript-ready)

When asked to implement a feature, return:

## Goal

One clear sentence.

## Types & Interfaces

Provide explicit `type`/`interface` for relevant domain models and API DTOs.

## Steps

1. Migration (if needed) — file + SQL snippet
2. Backend changes — function/edge function example (TS)
3. Frontend changes — component skeleton (TSX) with props typed
4. Manual commands

## Commands (manual)

```bash
bunx supabase migration new feature_name
bunx supabase db push
bun add zod
```

---

## 11. Examples of forbidden outputs

- Any generated TS code using `any`.
- Implicit-typed exports without explicit return types for public functions.
- Client-side role checks as sole authorization method (must be enforced by RLS/Edge Functions).

---

## 12. Enforcement & QA

- Agent should include a short checklist for the user to run static checks:

```bash
# run type-check
bunx tsc --noEmit

# run eslint
bunx eslint . --ext .ts,.tsx
```

- Recommend adding CI checks that enforce `tsc` and `eslint` before merge.

---

## 13. Deliverable formats

- Markdown (this doc)
- When generating code, include a small number of files with explicit types; avoid multi-file dumps unless requested.

---

## 14. Minimal examples to include when generating code

- Type definitions for domain models and API DTOs
- Zod (or runtime) schema for every external input (API response, user upload)
- Small TSX component using typed props and state

---

## 15. Summary: Type safety as a first-class rule

- Type safety is mandatory. Agent must produce TypeScript-first outputs with explicit types, avoid `any`, recommend runtime validation, and show commands/config snippets to enable stricter compiler/linter enforcement.

---
