# PolySim - GitHub Copilot Instructions

** Important: For every agent creating a pull request, ensure that these instructions are followed and updated as necessary. Keep it short!**

## Project Overview

PolySim is a Next.js 15 application with a companion CLI tool.
The web application is a full-stack TypeScript app with modern tooling and containerized deployment.
The CLI tool, `polytrace`, is a C++ application for tracing file accesses using `strace`.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS + DaisyUI for components or shadcn/ui for UI primitives
- **State Management**: React Query for server state
- **Authentication**: NextAuth.js with Keycloak provider
- **API**: tRPC for type-safe API routes with OpenAPI generation for public routes
- **Database**: PostgreSQL with Knex.js migrations
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Deployment**: Docker with multi-stage builds
- **Code Quality**: ESLint + Prettier with strict TypeScript config

## Architecture & File Structure

web application:

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes
│   ├── ├── auth/     # NextAuth
│   ├── ├── trpc/     # tRPC API handlers
│   ├── ├── public/   # Public API endpoints (OpenAPI generated
│   ├── (pages)/      # Application pages
│   └── layout.tsx    # Root layout with providers
├── components/       # React components
│   ├── client/       # Client-side components
│   └── ui/           # Reusable UI components (shadcn/ui generator pattern)
├── server/           # tRPC server code
│   └── controller/   # API endpoint definitions
│   └── router.ts     # tRPC router
├── lib/              # Utility functions and configs
└── types/            # TypeScript type definitions
```

CLI Tool (`polytrace`):

```
tools/polytrace/
├── build/            # Build output directory
├── include/          # C++ header files
├── src/              # C++ source files
└── test/             # C++ test files
```

use `make` to build and test the CLI tool.

## Development Guidelines

### Code Style & Patterns

1. **Component Naming**: Use PascalCase for components, camelCase for props
2. **File Naming**:
    - Components: `ComponentName.tsx`
    - Tests: `ComponentName.test.tsx`
    - API routes: tRPC handlers in `src/app/api/` and centralized manifest in `src/lib/appRoutes.ts`
3. **Import Organization**: Use `@/*` path aliases, group imports by external → internal
4. **TypeScript**: Strict mode enabled, avoid "any"
5. **Comments**: Comments are considered technical debt; strive for self-documenting code

### React Patterns

- Use `'use client'` directive for client-side components
- Prefer server components by default
- Use React hooks (useState, useEffect) in client components
- Implement proper error boundaries and loading states

### Styling Guidelines

- Styling should be encapsulated within components, avoid styling in "page.tsx" files
- Use shadcn/ui for UI primitives where possible
- Responsive design: Mobile-first approach with `md:`, `lg:` breakpoints

### API Development with tRPC

- Define procedures in `src/server/controller/`
- Use `procedure` for public endpoints, `protectedProcedure` for auth-required and 'patAccessibleProcedure' for public endpoints
- Input validation with Zod schemas
- Proper error handling with `TRPCError`

### Authentication

- Use NextAuth.js session management
- Keycloak integration for SSO
- PAT authentication for public API access
- Session available in both client and server components
- Protected routes use `protectedProcedure` in tRPC

### Route Management

PolySim uses a centralized route manifest system for type-safe navigation and consistent routing.

#### Best Practices

1. **Never use hardcoded route strings** - Always import from `APP_ROUTES` or use helpers
2. **Add new routes to the manifest** - Update `appRoutes.ts` when adding new pages
3. **Use route metadata** - Leverage labels, icons, and descriptions from the manifest
4. **Test route changes** - Route manifest has comprehensive unit tests
5. **Update middleware** - Public/protected route logic uses `getPublicRoutes()`

### Testing Standards

-> HIGH! test coverage expected
-> !NO MAGIC STRINGS!
-> e2e: Test critical user flows (auth, API docs, core features)
-> When possible build fixtures for reusable test data

### Development Workflow

1. **Commands**:

    ```bash
    # Setup
    ## Install dependencies
    npm install
    ## Start development environment
    docker compose -f docker-compose.development.yaml --env-file .env.development up --build

    # Code quality
    npm run lint           # Fix linting issues
    npm run format         # Format code with Prettier

    npm run test           # Unit tests
    npm run test:e2e       # E2E tests (requires dev server)

    npm run build          # Production build
    ```

#### UI Components

- UI primitives in `src/components/ui/` follow the [shadcn/ui](https://ui.shadcn.com/) generator structure. Use the shadcn/ui generator for new primitives and keep to its conventions for consistency and maintainability.
- Use class-variance-authority for variant management
- Export components with proper TypeScript interfaces
