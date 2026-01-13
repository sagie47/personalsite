# AGENTS.md

This document provides guidelines for agentic coding agents working in this repository.

## Project Overview

This is a Windows 95-themed desktop environment built with React, TypeScript, and Vite. The application simulates a retro operating system with multiple interactive "apps" including a terminal, browser, synthesizer, game, and library.

## Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Dependencies

- React 19.2.3
- TypeScript 5.8.x
- Vite 6.2.x
- Google GenAI SDK 1.34.0

## Code Style Guidelines

### TypeScript & Types

- Use TypeScript for all code; no plain JavaScript files
- Define interfaces for all props in `types.ts`
- Use explicit return types for functions
- Prefer `React.FC<T>` for functional components
- Use `React.Dispatch<React.SetStateAction<T>>` for state setters
- Avoid `any` type; use `unknown` or proper type annotations

### Component Patterns

- Place component interfaces directly above component definitions
- Use named exports for components
- Props interfaces should have descriptive names (e.g., `TerminalProps`)
- Destructure props in component signatures
- Use default values for optional props (`isFocused = true`)
- Keep components focused; extract sub-components when files exceed ~150 lines

### Imports

```typescript
// React core imports
import React, { useState, useEffect, useRef } from 'react';

// Local imports - use relative paths
import Window from './Window';
import { TerminalLine, BlogPost } from '../types';
import { WELCOME_MESSAGE, ASCII_ART } from '../constants';

// Sort imports: React → external → local (grouped)
```

### Naming Conventions

- **Components**: PascalCase (e.g., `Terminal`, `Bookshelf`)
- **Files**: camelCase for utilities, PascalCase for components (e.g., `constants.ts`, `Terminal.tsx`)
- **Interfaces**: PascalCase with descriptive names (e.g., `BlogPost`, `TerminalLine`)
- **Variables**: camelCase (e.g., `openApps`, `commandHistory`)
- **Constants**: SCREAMING_SNAKE_CASE for values, camelCase for objects (e.g., `ASCII_ART`, `blogPosts`)
- **CSS classes**: Tailwind utility classes (e.g., `className="w-8 h-8 bg-teal-700"`)

### State Management

- Use `useState` for local component state
- Use `useEffect` for side effects with cleanup functions
- Use `useRef` for mutable values that don't trigger re-renders
- Prefer functional state updates: `setOpenApps(prev => [...prev, appId])`
- Lift state up to `App.tsx` for shared state between components

### Error Handling

- Use early returns for validation
- Throw errors for unrecoverable states: `throw new Error("Could not find root element")`
- Handle null checks explicitly: `if (!rootElement) { ... }`

### Styling

- Use Tailwind CSS utility classes for all styling
- Use inline `<style>` tags for complex animations (see App.tsx for examples)
- Use CSS custom properties for theme values
- Follow Windows 95 aesthetic: `#c0c0c0` backgrounds, `inset` shadows for 3D effects

### File Organization

```
root/
├── App.tsx              # Main app with window management
├── components/          # React components
│   ├── Terminal.tsx     # CLI terminal emulator
│   ├── Browser.tsx      # Web browser simulation
│   ├── Synth.tsx        # Audio synthesizer
│   ├── PlatformerGame.tsx
│   ├── Bookshelf.tsx
│   ├── Window.tsx       # Window chrome wrapper
│   └── ...
├── constants.ts         # Static data (posts, projects, books)
├── types.ts             # TypeScript interfaces
├── index.tsx            # Entry point
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

### React Patterns

- Use `React.useEffect` with dependency arrays
- Clean up intervals/timeouts in `useEffect` cleanup functions
- Use `useRef` to avoid stale closures in async callbacks
- Use `key` props in lists
- Prefer controlled inputs over uncontrolled

### API Integration

- The project uses `@google/genai` for Gemini API integration
- API key is loaded from `GEMINI_API_KEY` environment variable
- Access via `process.env.GEMINI_API_KEY` (defined in vite.config.ts)

## Testing

No test framework is currently configured. When adding tests:

- Use Vitest for unit tests
- Place tests alongside components with `.test.tsx` extension
- Run single test: `npm test -- --run --reporter=verbose`

## Linting

No ESLint configuration exists. When adding linting:

- Run: `npx eslint src/**/*.{ts,tsx}`
- Fix issues before committing

## Git Workflow

- Create feature branches for new functionality
- Write meaningful commit messages
- Keep commits focused and atomic

## Key Files

- `App.tsx:1` - Main application with window management
- `constants.ts:4` - Static content data
- `types.ts:3` - TypeScript interface definitions
- `vite.config.ts:5` - Build configuration
