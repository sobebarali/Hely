# Web App - Frontend Guidelines

## Tech Stack
Vite + React 19, TanStack Router (file-based), TanStack Query, shadcn/ui, Tailwind CSS 4

## Routing
- File-based: `src/routes/*.tsx` auto-generates route tree
- Dashboard routes are protected via `beforeLoad` auth check in `routes/dashboard.tsx`
- Nested routes: `routes/dashboard/{feature}.tsx`

## Data Fetching
- API clients: `src/lib/{feature}-client.ts` — HTTP functions
- Hooks: `src/hooks/use-{feature}.ts` — TanStack Query wrappers
- Query keys organized by feature domain
- Default stale time: 5 minutes

## Adding a New Feature Page
1. Create API client in `src/lib/{feature}-client.ts`
2. Create query hook in `src/hooks/use-{feature}.ts`
3. Create route in `src/routes/dashboard/{feature}.tsx`
4. Use shadcn/ui components from `src/components/ui/`

## Component Conventions
- shadcn/ui primitives in `src/components/ui/` — don't modify directly
- Feature components in `src/components/`
- Forms: TanStack Form + Zod validation
- Toast notifications: Sonner
- Tables: TanStack Table with dnd-kit sorting (`data-table.tsx`)

## Auth
- Token management in `src/lib/auth-client.ts` and `src/lib/api-client.ts`
- Automatic token refresh before expiry
- localStorage keys: `hms_access_token`, `hms_refresh_token`, `hms_token_expiry`

## Styling
- Tailwind CSS 4 (via @tailwindcss/vite plugin)
- Use `cn()` from `src/lib/utils.ts` for conditional classes
- Dark mode via next-themes
