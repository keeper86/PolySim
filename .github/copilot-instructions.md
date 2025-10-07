# PolySim - GitHub Copilot Instructions

## Project Overview

PolySim is a Next.js 15 application serving as a playground for data visualization and analysis. It's a full-stack TypeScript application with modern tooling and containerized deployment.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS + DaisyUI for components
- **Authentication**: NextAuth.js with Keycloak provider
- **API**: tRPC for type-safe API routes with OpenAPI generation
- **Database**: PostgreSQL with Knex.js migrations
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Deployment**: Docker with multi-stage builds
- **Code Quality**: ESLint + Prettier with strict TypeScript config

## Architecture & File Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (NextAuth, tRPC handlers)
│   ├── (pages)/      # Application pages
│   └── layout.tsx    # Root layout with providers
├── components/       # React components
│   ├── client/       # Client-side components
│   └── ui/           # Reusable UI components (shadcn/ui generator pattern)
├── server/           # tRPC server code
│   └── endpoints/    # API endpoint definitions
├── lib/              # Utility functions and configs
└── types/            # TypeScript type definitions
```

## Development Guidelines

### Code Style & Patterns

1. **Component Naming**: Use PascalCase for components, camelCase for props
2. **File Naming**:
    - Components: `ComponentName.tsx`
    - Tests: `ComponentName.test.tsx`
    - API routes: tRPC handlers in `src/app/api/` and centralized manifest in `src/lib/pageRoutes.ts`
3. **Import Organization**: Use `@/*` path aliases, group imports by external → internal
4. **TypeScript**: Strict mode enabled, prefer explicit types over `any`
5. **Comments**: Comments are considered technical debt; strive for self-documenting code

### React Patterns

- Use `'use client'` directive for client-side components
- Prefer server components by default
- Use React hooks (useState, useEffect) in client components
- Implement proper error boundaries and loading states

### Styling Guidelines

- Use Tailwind CSS utilities primarily
- DaisyUI components for complex UI elements (buttons, dropdowns, etc.)
- For reusable UI primitives, use the [shadcn/ui](https://ui.shadcn.com/) generator and conventions. New UI components should be generated or structured according to shadcn/ui best practices (see `components.json`).
- Consistent spacing: `px-2 md:px-6` for responsive padding
- Theme variables: Use DaisyUI theme colors (`primary`, `base-100`, etc.)
- Responsive design: Mobile-first approach with `md:`, `lg:` breakpoints

### API Development with tRPC

- Define procedures in `src/server/endpoints/`
- Use `procedure` for public endpoints, `protectedProcedure` for auth-required
- Implement OpenAPI metadata for documentation
- Input validation with Zod schemas
- Proper error handling with `TRPCError`

Example tRPC endpoint:

```typescript
export const exampleEndpoint = (procedure: ProcedureBuilderType, path: string) =>
    procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['example'],
                summary: 'Example endpoint',
            },
        })
        .input(z.object({ param: z.string() }))
        .output(z.object({ result: z.string() }))
        .query(async ({ input }) => {
            return { result: `Hello ${input.param}` };
        });
```

### Authentication

- Use NextAuth.js session management
- Keycloak integration for SSO
- Session available in both client and server components
- Protected routes use `protectedProcedure` in tRPC

### Route Management

PolySim uses a centralized route manifest system for type-safe navigation and consistent routing.

#### Route Manifest (`src/lib/pageRoutes.ts`)

All application routes are defined in a single source of truth:

```typescript
import { ROUTES, APP_ROUTES, buildPath, getRouteMetadata } from '@/lib/pageRoutes';

// Use route constants instead of hardcoded strings
<Link href={ROUTES.projects}>Projects</Link>

// Access route metadata
const metadata = getRouteMetadata('projects');
console.log(metadata.label, metadata.icon);

// Build dynamic paths (future extensibility)
const path = buildPath('projects', { id: '123' }); // /projects/123
```

#### Key Features

- **Type Safety**: All routes are strongly typed with TypeScript
- **Metadata**: Each route includes label, icon, visibility, and description
- **Helper Functions**: Utilities for path building, active route detection, and breadcrumbs
- **Single Source**: One manifest replaces multiple hardcoded route references

#### Available Helpers

- `buildPath(routeKey, params?)` - Build paths with optional parameters
- `getRouteMetadata(routeKey)` - Get full route metadata
- `getRouteLabel(path)` - Get human-readable label for any path
- `isActiveRoute(path, routeKey)` - Check if a route is currently active
- `getBreadcrumbData(pathname)` - Generate breadcrumb trail
- `getMainNavRoutes()` - Get primary navigation routes
- `getSecondaryNavRoutes()` - Get secondary navigation routes
- `getPublicRoutes()` / `getProtectedRoutes()` - Filter by access level

#### Navigation Components

All navigation components use the manifest:

- `DynamicBreadcrumbs` - Auto-generates breadcrumbs from route metadata
- `NavMain` - Primary sidebar navigation using `getMainNavRoutes()`
- `NavSecondary` - Secondary navigation using `getSecondaryNavRoutes()`
- `AppSidebar` - Main sidebar container with logo and navigation

#### Best Practices

1. **Never use hardcoded route strings** - Always import from `ROUTES` or use helpers
2. **Add new routes to the manifest** - Update `pageRoutes.ts` when adding new pages
3. **Use route metadata** - Leverage labels, icons, and descriptions from the manifest
4. **Test route changes** - Route manifest has comprehensive unit tests
5. **Update middleware** - Public/protected route logic uses `getPublicRoutes()`

#### Example: Adding a New Route

```typescript
// 1. Add to ROUTES constant
export const ROUTES = {
    // existing routes...
    newFeature: '/new-feature',
} as const;

// 2. Add metadata to APP_ROUTES
newFeature: {
    path: ROUTES.newFeature,
    label: 'New Feature',
    icon: NewIcon,
    isPublic: false,
    description: 'Description of new feature',
},

// 3. Use in components
<Link href={ROUTES.newFeature}>
    {getRouteMetadata('newFeature').label}
</Link>
```

### Testing Standards

#### Unit Tests (Vitest)

- Test files alongside components: `Component.test.tsx`
- Use React Testing Library for component testing
- Mock external dependencies and API calls
- Aim for meaningful test coverage, not just high percentages

#### E2E Tests (Playwright)

- Located in `tests/e2e/`
- Test critical user flows (auth, API docs, core features)
- Use page object pattern for maintainability
- Store authentication state for test efficiency

### Database & Migrations

- Use Knex.js for database operations and migrations
- Migration files in `migrations/` directory
- Commands: `npm run migrate:make`, `npm run migrate:latest`
- PostgreSQL as primary database

### Development Workflow

1. **Local Setup**:

    ```bash
    # Install dependencies
    npm install

    # Start development environment
    docker compose -f docker-compose.development.yaml --env-file .env.development up --build
    ```

2. **Code Quality**:

    ```bash
    # Linting and formatting
    npm run lint           # Fix linting issues
    npm run format         # Format code with Prettier

    # Testing
    npm run test           # Unit tests
    npm run test:e2e       # E2E tests (requires dev server)
    ```

3. **Build Process**:
    ```bash
    npm run build          # Production build
    ```

### Environment Configuration

- Development: `.env.development` with Docker Compose
- Environment variables for Keycloak, database, and app config
- SSL certificates required for local development (mkcert recommended)
- Never commit secrets or certificates to repository

### Component Guidelines

#### Client Components

- Use `'use client'` directive
- Handle user interactions and browser APIs
- Manage local state with useState/useReducer
- Example: Forms, interactive charts, navigation

#### Server Components (Default)

- Fetch data directly in components
- No client-side JavaScript
- Better performance and SEO
- Example: Static content, data displays

#### UI Components

- UI primitives in `src/components/ui/` follow the [shadcn/ui](https://ui.shadcn.com/) generator structure. Use the shadcn/ui generator for new primitives and keep to its conventions for consistency and maintainability.
- Use class-variance-authority for variant management
- Export components with proper TypeScript interfaces

### Performance Considerations

- Use Next.js Image component for optimized images
- Implement proper loading states and skeleton screens
- Lazy load heavy components when appropriate
- Database query optimization with proper indexing

### Security Best Practices

- Input validation on both client and server
- CSRF protection via NextAuth.js
- Environment variable validation
- Secure headers configuration
- Regular dependency updates

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint:check      # Check for linting issues
npm run lint            # Fix linting issues automatically
npm run format:check    # Check code formatting
npm run format          # Format code with Prettier

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run E2E tests
npm run test:e2e:headed # Run E2E tests with browser UI

# Database
npm run migrate:make    # Create new migration
npm run migrate:latest  # Run pending migrations
npm run migrate:rollback # Rollback last migration
```

## Key Dependencies to Remember

- **Next.js 15**: Latest features, App Router, Server Components
- **tRPC**: Type-safe API development with `@trpc/server`, `@trpc/client`
- **Authentication**: `next-auth` with Keycloak provider
- **Database**: `knex` for queries and migrations, `pg` for PostgreSQL
- **Testing**: `vitest`, `@testing-library/react`, `@playwright/test`
- **Styling**: `tailwindcss`, `daisyui` for component library
- **Validation**: `zod` for schema validation
- **Charts**: `chart.js` with `react-chartjs-2` for data visualization

## Documentation & API

- API documentation available at `/api-doc` (Swagger UI)
- OpenAPI specification at `/api/openapi.json`
- README.md contains setup and deployment instructions
- E2E test documentation in `tests/e2e/README.md`

When working on this project, prioritize type safety, proper error handling, responsive design, and maintainable code patterns. Follow the established patterns and contribute to the comprehensive testing suite.
