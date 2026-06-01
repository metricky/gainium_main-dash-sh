# Modular Trading Dashboard

Extensible trading dashboard with customizable layouts, reusable components, and modular architecture.

## Tech Stack
- **Core:** React 18 + TypeScript (strict) + Vite
- **UI:** Tailwind CSS + shadcn/ui + clsx
- **State:** Zustand + React Query
- **Layout:** React Router v6 + react-grid-layout
- **Testing:** Playwright

## Folder Structure
```
src/
├── components/     # Reusable UI components
│   ├── ui/        # shadcn/ui components
│   ├── layout/    # Layout components
│   ├── widgets/   # Dashboard widgets
│   └── common/    # Shared components
├── pages/         # Route-level pages
├── hooks/         # Custom React hooks
├── stores/        # Zustand stores
├── lib/           # Utilities and configs
│   ├── api/      # API client
│   ├── utils/    # Helper functions
│   └── types/    # TypeScript types
└── assets/        # Static assets
```

## Development Rules

### Required Practices
- **TypeScript strict mode** - No `any` types, explicit return types
- **Playwright tests** - Required for all UI changes
- **Script usage** - Always use `/scripts` folder scripts, never start server directly
- **Health checks** - Always check health endpoint before server operations
- **Logger utility** - Check for existing logger before adding features, use for debugging

### Code Standards
- Tailwind CSS utility classes over custom CSS
- shadcn/ui component patterns
- Functional components with hooks
- Proper TypeScript interfaces

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:host         # Start with network access

# Building
npm run build            # Production build
npm run preview          # Preview build

# Testing
npm run test             # Run Playwright tests
npm run test:ui          # Playwright with UI
npm run test:debug       # Debug mode

# Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix issues
npm run type-check       # TypeScript check
npm run format           # Prettier format
```

## Server Management

**CRITICAL:** Always use scripts in `/scripts` folder - never start server directly!

### Health Check First
Before any server operation, check health endpoint status:
- View health status at `/server-health.html`
- Verify server state before starting/stopping
- Ensure proper server lifecycle management

### Available Scripts

**Start Server:** `./scripts/start.sh`
- Checks health endpoint first
- Auto-terminates conflicting instances
- Starts fresh server in background

**Stop Server:** `./scripts/stop.sh`
- Checks current server status
- Gracefully terminates all instances

**Reload:** `./scripts/reload.sh`
- Complete cycle: stop → pull → start
- Includes health checks and error handling

**Pull Changes:** `./scripts/pull.sh`
- Git pull with rebase
- Validates clean working directory

## Logger Utility

**IMPORTANT:** Always check for existing logger utility before implementing new features!

### Before Adding Features
1. Search for existing logger in `src/lib/utils/` or `src/hooks/`
2. Check if logging functionality already exists
3. Use existing logger for consistent debugging across the app
4. If no logger exists, create one following project patterns

### Logger Usage
- Import and use existing logger for all debugging
- Consistent log levels (error, warn, info, debug)
- Proper error handling and stack traces
- Development vs production logging strategies

## Installation & Setup

### Dependencies
```bash
# Core dependencies
npm install tailwindcss clsx zustand @tanstack/react-query react-router-dom@6 react-grid-layout class-variance-authority tailwind-merge lucide-react

# Dev dependencies
npm install -D prettier husky tailwindcss postcss autoprefixer
```

### shadcn/ui Setup
```bash
# Add components
npx shadcn@latest add [component-name]

# Components install to src/components/ui/
# Move manually if they go to @/components/ui/
```

## Quick Reference
- **State:** Zustand (global) + React Query (server)
- **Routing:** React Router v6 with nested routes
- **Layout:** react-grid-layout for widgets
- **Testing:** Playwright required for UI changes
- **Server:** Use `/scripts` only, check health first
- **Logging:** Check existing logger before adding features
