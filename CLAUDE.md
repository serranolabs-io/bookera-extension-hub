# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Monorepo management:**

- `turbo dev` - Start development for all workspaces
- `turbo build` - Build all workspaces
- `turbo lint -- --fix` - Lint all workspaces with auto-fix
- `bun run format` - Format code with Prettier

**UI Application (apps/ui):**

- `cd apps/ui && bun run dev` - Start development server on port 5003
- `cd apps/ui && bun run build` - Build production version
- `cd apps/ui && bun run test` - Run tests with Bun
- `cd apps/ui && bun run cypress` - Open Cypress for testing
- `cd apps/ui && bun run lint` - Run ESLint with TypeScript support

**Module Development:**

- Individual modules in `packages/modules/` have their own dev servers
- Each module can be developed independently with `bun run dev`

## Architecture Overview

**Monorepo Structure:**
This is a Turbo monorepo using Bun as the package manager with workspaces for:

- `apps/ui` - Main Bookera application (Lit Elements + Vite)
- `packages/modules/` - Feature modules (themes, keyboard-shortcuts, extension-marketplace, user)
- `packages/extensions/` - Extension configurations
- `packages/shared` - Shared utilities and base classes
- `packages/typescript-config` - Shared TypeScript configuration

**Technology Stack:**

- **Monorepo:** Turbo + Bun workspaces
- **Framework:** Lit Elements (Web Components) with TypeScript
- **Build Tool:** Vite with Bun runtime
- **Testing:** Bun Test + Vitest + Cypress
- **Styling:** CSS-in-JS with Lit's css tagged template literals
- **State Management:** Saddlebag (@pb33f/saddlebag) + LocalForage for persistence
- **Backend:** Supabase integration

**Key Dependencies:**

- `@serranolabs.io/shared` - Core shared utilities and base classes
- `@serranolabs.io/bookera-*` - Bookera-specific extension modules
- `@shoelace-style/shoelace` - Web component UI library
- `@supabase/supabase-js` - Backend integration
- `@pb33f/saddlebag` - State management bags
- `lit` - Web Components framework

**Module System Architecture:**
The application uses a sophisticated modular architecture:

1. **Module Registry:** Central registry (`ModuleRegistry` class) manages all modules
2. **Module Types:** Two types of modules exist:
   - Core modules (built-in functionality)
   - Extension modules (user-installable)
3. **Module Structure:** Each module follows standardized structure:
   - `module.ts` - Module definition with metadata
   - `*-element.ts` - Lit Element implementation
   - `*.styles.ts` - CSS-in-JS styling
   - `package.json` - Module metadata
4. **Render Modes:** Modules can render in:
   - Settings panels (`renderInSettings()`)
   - Side panels (`renderInSidePanel()`)
5. **State Persistence:** Module state persisted via LocalForage + Saddlebag

**Core Modules:**

- `themes` - Theme switching and dark mode
- `keyboard-shortcuts` - Customizable keyboard shortcuts
- `extension-marketplace` - Extension discovery and installation
- `user` - User authentication and management

**Extension System:**

- Extensions stored in `packages/extensions/configs/`
- Each extension has user-specific configurations
- Extensions can be published to and installed from marketplace
- Extension configurations include metadata, icons, and settings

**UI Application Structure:**

```
apps/ui/src/
├── components/
│   ├── studio/manuscript-view/    # Main document editing interface
│   │   ├── modules/              # Module system integration
│   │   ├── panel/               # Panel management system
│   │   ├── side-panel/          # Side panel components
│   │   └── mobile-view/         # Mobile-responsive components
│   ├── layout/                  # App layout components
│   └── viewer/                  # Document viewer
├── lib/
│   ├── model/                   # Data models and context
│   └── git/                     # Git integration utilities
└── pages/                       # Top-level page components
```

**Development Patterns:**

- Event-driven communication between components
- Context providers for shared state (Lit Context API)
- Module registry pattern for extensibility
- Shadow DOM encapsulation for component isolation
- TypeScript decorators for component registration (@customElement)

**Environment Variables:**

- `SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service key (server-side)
