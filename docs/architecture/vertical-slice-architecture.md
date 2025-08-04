# Vertical Slice Architecture

This project follows a Vertical Slice Architecture pattern, organizing code by features rather than technical layers. This approach promotes better cohesion, maintainability, and scalability.

## Directory Structure

```
client/
├── features/                     # Feature-based modules
│   ├── songs/                   # Songs feature
│   │   ├── __tests__/          # Feature-specific tests
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── api/                # API calls and queries
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Feature-specific utilities
│   │   └── index.ts            # Public exports
│   │
│   ├── dashboard/              # Dashboard feature
│   ├── setlists/               # Setlists feature
│   ├── arrangements/           # Arrangements feature
│   ├── auth/                   # Authentication feature
│   └── admin/                  # Admin feature
│
├── shared/                      # Cross-feature shared code
│   ├── components/             # Shared UI components
│   │   └── Layout/            # App layout component
│   ├── hooks/                  # Shared custom hooks
│   ├── utils/                  # Shared utilities
│   └── types/                  # Global types
│
├── components/                  # UI component library (shadcn/ui)
│   └── ui/                     # Base UI components
│
└── test/                        # Test utilities and setup

```

## Key Principles

### 1. Feature Independence
Each feature is self-contained with its own:
- Components
- Business logic (hooks)
- API integration
- Types and schemas
- Tests

### 2. Public API via index.ts
Each feature exports only what's needed by other features through its index.ts file:

```typescript
// features/songs/index.ts
export { SongCard } from "./components/SongCard";
export { useSongSearch } from "./hooks/useSongSearch";
export type { Song, ChordChart } from "./types/song.types";
```

### 3. Import Paths
Use path aliases for clean imports:
- `@features/songs` - Access feature exports
- `@/shared` - Access shared components/utilities
- `@/components/ui` - Access UI component library

### 4. Feature Structure Guidelines

#### Components
- Feature-specific React components
- Keep components focused and single-purpose
- Co-locate related components

#### Hooks
- Custom hooks for feature logic
- API data fetching hooks
- State management hooks

#### Types
- TypeScript interfaces and types
- Keep types close to where they're used
- Export shared types through index.ts

#### API
- API client functions
- React Query hooks
- API response transformations

#### Schemas
- Zod validation schemas
- Form validation schemas
- API request/response validation

#### Utils
- Feature-specific helper functions
- Constants and configurations
- Data transformations

## Benefits

1. **Better Organization**: Related code stays together
2. **Easier Navigation**: Find all code for a feature in one place
3. **Reduced Coupling**: Features are independent
4. **Parallel Development**: Teams can work on features independently
5. **Easier Testing**: Test entire features in isolation
6. **Clear Dependencies**: Explicit imports show feature relationships

## Example: Adding a New Feature

To add a new "recordings" feature:

1. Create feature directory:
```bash
mkdir -p client/features/recordings/{components,hooks,api,types,__tests__}
```

2. Create the index.ts:
```typescript
// client/features/recordings/index.ts
export { RecordingsList } from "./components/RecordingsList";
export { useRecordings } from "./hooks/useRecordings";
export type { Recording } from "./types/recording.types";
```

3. Import in other features:
```typescript
import { useRecordings } from "@features/recordings";
```

## Migration Notes

This codebase was migrated from a traditional layered architecture. The migration involved:
1. Creating feature directories
2. Moving components to their respective features
3. Extracting shared components to the shared directory
4. Updating import paths
5. Adding TypeScript path aliases

Future development should follow the vertical slice pattern for new features.