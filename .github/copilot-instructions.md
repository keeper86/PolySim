# PolySim - GitHub Copilot Instructions

** Important: For every agent creating a pull request, ensure that these instructions are followed and updated as necessary. Keep it short!**

## Project Overview

PolySim is a Next.js 15 application with a companion CLI tool.
The web application is a full-stack TypeScript app with modern tooling and containerized deployment.
The CLI tool, `polytrace`, is a C++ application for tracing file accesses using `strace`.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: shadcn/ui for UI primitives, Tailwind CSS with DaisyUI available but being phased out
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

# shadcn/ui

> shadcn/ui is a collection of beautifully-designed, accessible components and a code distribution platform. It is built with TypeScript, Tailwind CSS, and Radix UI primitives. It supports multiple frameworks including Next.js, Vite, Remix, Astro, and more. Open Source. Open Code. AI-Ready. It also comes with a command-line tool to install and manage components and a registry system to publish and distribute code.

## Overview

- [CLI](https://ui.shadcn.com/docs/cli): Command-line tool for installing and managing components.
- [components.json](https://ui.shadcn.com/docs/components-json): Configuration file for customizing the CLI and component installation.
- [Theming](https://ui.shadcn.com/docs/theming): Guide to customizing colors, typography, and design tokens.

## Installation

- [Next.js](https://ui.shadcn.com/docs/installation/next): Install shadcn/ui in a Next.js project.

## Components

### Form & Input

- [Form](https://ui.shadcn.com/docs/components/form): Building forms with React Hook Form and Zod validation.
- [Field](https://ui.shadcn.com/docs/components/field): Field component for form inputs with labels and error messages.
- [Button](https://ui.shadcn.com/docs/components/button): Button component with multiple variants.
- [Button Group](https://ui.shadcn.com/docs/components/button-group): Group multiple buttons together.
- [Input](https://ui.shadcn.com/docs/components/input): Text input component.
- [Input Group](https://ui.shadcn.com/docs/components/input-group): Input component with prefix and suffix addons.
- [Input OTP](https://ui.shadcn.com/docs/components/input-otp): One-time password input component.
- [Textarea](https://ui.shadcn.com/docs/components/textarea): Multi-line text input component.
- [Checkbox](https://ui.shadcn.com/docs/components/checkbox): Checkbox input component.
- [Radio Group](https://ui.shadcn.com/docs/components/radio-group): Radio button group component.
- [Select](https://ui.shadcn.com/docs/components/select): Select dropdown component.
- [Switch](https://ui.shadcn.com/docs/components/switch): Toggle switch component.
- [Slider](https://ui.shadcn.com/docs/components/slider): Slider input component.
- [Calendar](https://ui.shadcn.com/docs/components/calendar): Calendar component for date selection.
- [Date Picker](https://ui.shadcn.com/docs/components/date-picker): Date picker component combining input and calendar.
- [Combobox](https://ui.shadcn.com/docs/components/combobox): Searchable select component with autocomplete.
- [Label](https://ui.shadcn.com/docs/components/label): Form label component.

### Layout & Navigation

- [Accordion](https://ui.shadcn.com/docs/components/accordion): Collapsible accordion component.
- [Breadcrumb](https://ui.shadcn.com/docs/components/breadcrumb): Breadcrumb navigation component.
- [Navigation Menu](https://ui.shadcn.com/docs/components/navigation-menu): Accessible navigation menu with dropdowns.
- [Sidebar](https://ui.shadcn.com/docs/components/sidebar): Collapsible sidebar component for app layouts.
- [Tabs](https://ui.shadcn.com/docs/components/tabs): Tabbed interface component.
- [Separator](https://ui.shadcn.com/docs/components/separator): Visual divider between content sections.
- [Scroll Area](https://ui.shadcn.com/docs/components/scroll-area): Custom scrollable area with styled scrollbars.
- [Resizable](https://ui.shadcn.com/docs/components/resizable): Resizable panel layout component.

### Overlays & Dialogs

- [Dialog](https://ui.shadcn.com/docs/components/dialog): Modal dialog component.
- [Alert Dialog](https://ui.shadcn.com/docs/components/alert-dialog): Alert dialog for confirmation prompts.
- [Sheet](https://ui.shadcn.com/docs/components/sheet): Slide-out panel component (drawer).
- [Drawer](https://ui.shadcn.com/docs/components/drawer): Mobile-friendly drawer component using Vaul.
- [Popover](https://ui.shadcn.com/docs/components/popover): Floating popover component.
- [Tooltip](https://ui.shadcn.com/docs/components/tooltip): Tooltip component for additional context.
- [Hover Card](https://ui.shadcn.com/docs/components/hover-card): Card that appears on hover.
- [Context Menu](https://ui.shadcn.com/docs/components/context-menu): Right-click context menu.
- [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu): Dropdown menu component.
- [Menubar](https://ui.shadcn.com/docs/components/menubar): Horizontal menubar component.
- [Command](https://ui.shadcn.com/docs/components/command): Command palette component (cmdk).

### Feedback & Status

- [Alert](https://ui.shadcn.com/docs/components/alert): Alert component for messages and notifications.
- [Toast](https://ui.shadcn.com/docs/components/toast): Toast notification component using Sonner.
- [Progress](https://ui.shadcn.com/docs/components/progress): Progress bar component.
- [Spinner](https://ui.shadcn.com/docs/components/spinner): Loading spinner component.
- [Skeleton](https://ui.shadcn.com/docs/components/skeleton): Skeleton loading placeholder.
- [Badge](https://ui.shadcn.com/docs/components/badge): Badge component for labels and status indicators.
- [Empty](https://ui.shadcn.com/docs/components/empty): Empty state component for no data scenarios.

### Display & Media

- [Avatar](https://ui.shadcn.com/docs/components/avatar): Avatar component for user profiles.
- [Card](https://ui.shadcn.com/docs/components/card): Card container component.
- [Table](https://ui.shadcn.com/docs/components/table): Table component for displaying data.
- [Data Table](https://ui.shadcn.com/docs/components/data-table): Advanced data table with sorting, filtering, and pagination.
- [Chart](https://ui.shadcn.com/docs/components/chart): Chart components using Recharts.
- [Carousel](https://ui.shadcn.com/docs/components/carousel): Carousel component using Embla Carousel.
- [Aspect Ratio](https://ui.shadcn.com/docs/components/aspect-ratio): Container that maintains aspect ratio.
- [Typography](https://ui.shadcn.com/docs/components/typography): Typography styles and components.
- [Item](https://ui.shadcn.com/docs/components/item): Generic item component for lists and menus.
- [Kbd](https://ui.shadcn.com/docs/components/kbd): Keyboard shortcut display component.

### Misc

- [Collapsible](https://ui.shadcn.com/docs/components/collapsible): Collapsible container component.
- [Toggle](https://ui.shadcn.com/docs/components/toggle): Toggle button component.
- [Toggle Group](https://ui.shadcn.com/docs/components/toggle-group): Group of toggle buttons.
- [Pagination](https://ui.shadcn.com/docs/components/pagination): Pagination component for lists and tables.

## Dark Mode

- [Dark Mode](https://ui.shadcn.com/docs/dark-mode): Overview of dark mode implementation.
- [Dark Mode - Next.js](https://ui.shadcn.com/docs/dark-mode/next): Dark mode setup for Next.js.
