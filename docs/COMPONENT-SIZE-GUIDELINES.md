# Component Size Guidelines

## ESLint Rules for Component Size Enforcement

This project enforces component size limits through ESLint rules to maintain code quality and readability.

## Size Limits

### React Components (`client/features/**/components/*.tsx`, `client/components/**/*.tsx`)

- **Maximum lines per file**: 200 lines (ERROR)
- **Maximum lines per function**: 100 lines (WARNING)
- Blank lines and comments are not counted

### General TypeScript/JavaScript Files

- **Maximum lines per file**: 300 lines (WARNING)
- **Maximum lines per function**: 150 lines (WARNING)

### Test Files (`*.test.tsx`, `*.spec.tsx`)

- **Maximum lines per file**: 600 lines (WARNING)
- **Maximum lines per function**: No limit (tests can have long describe blocks)

## Rationale

Smaller components are:

- **Easier to understand** - You can grasp the entire component's purpose quickly
- **Easier to test** - Fewer code paths and edge cases
- **Easier to maintain** - Changes are localized and predictable
- **More reusable** - Focused components can be used in more contexts

## What to Do When a Component is Too Large

### 1. Extract Sub-Components

Break down large components into smaller, focused components:

```tsx
// Before: One large component
export function LargeComponent() {
  // 500+ lines of mixed concerns
}

// After: Multiple focused components
export function MainComponent() {
  return (
    <>
      <SearchBar />
      <FilterControls />
      <DataGrid />
      <Pagination />
    </>
  );
}
```

### 2. Extract Custom Hooks

Move complex logic into custom hooks:

```tsx
// Before: Logic mixed in component
function Component() {
  // 50 lines of data fetching logic
  // 30 lines of form handling
  // Component render
}

// After: Logic in custom hooks
function Component() {
  const { data, loading } = useDataFetch();
  const { form, handleSubmit } = useFormLogic();
  // Clean component render
}
```

### 3. Extract Utility Functions

Move pure functions outside the component:

```tsx
// Before: Functions inside component
function Component() {
  const calculateTotal = (items) => {
    /* ... */
  };
  const formatDate = (date) => {
    /* ... */
  };
  // Component logic
}

// After: Utility functions in separate file
import { calculateTotal, formatDate } from "./utils";

function Component() {
  // Cleaner component logic
}
```

## Running ESLint

### Check all files

```bash
npm run lint
```

### Auto-fix issues

```bash
npm run lint:fix
```

### Check specific file

```bash
npx eslint path/to/component.tsx
```

## Suppressing Rules (Use Sparingly)

If you absolutely need to exceed the limit (e.g., for a complex form component), you can disable the rule for that file:

```tsx
/* eslint-disable max-lines */
// Your component code
```

However, this should be rare and well-justified. Consider refactoring first.

## Example Refactoring

See the recent refactoring of `ReviewsList.tsx` (464 → 324 lines) where we extracted:

- `StarRating.tsx` - Reusable rating component
- `ReviewCard.tsx` - Individual review display
- `ReviewsSummary.tsx` - Rating statistics display

This made each component focused, testable, and reusable while improving overall maintainability.
