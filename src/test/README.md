# Testing Guide

## Setup

This project uses **Vitest** for unit and integration testing, along with **React Testing Library** for component testing.

### Dependencies Installed
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `@vitest/ui` - Visual test runner UI
- `jsdom` - DOM implementation for Node.js

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test src/test/hooks/useExtractionRealtime.test.ts
```

## Test Structure

```
src/test/
├── setup.ts                              # Global test setup
├── components/                           # Component tests
│   └── DocumentViewer.test.tsx
├── hooks/                                # Custom hooks tests
│   └── useExtractionRealtime.test.ts
├── services/                             # Service layer tests
│   └── documentApprovalLog.test.ts
└── utils/                                # Utility function tests
    └── unifiedToast.test.ts
```

## Writing Tests

### Component Tests

```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeDefined();
  });
});
```

### Hook Tests

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

### Service Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myService } from '@/services/myService';

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call API correctly', async () => {
    const result = await myService.getData();
    expect(result).toBeDefined();
  });
});
```

## Mocking

### Supabase Client

The Supabase client is automatically mocked in `setup.ts`. All database calls will return empty results by default.

### Custom Mocks

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('@/services/myService', () => ({
  myService: {
    getData: vi.fn(() => Promise.resolve({ data: [] }))
  }
}));

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('test');
```

## Coverage Goals

- **Unit Tests**: >80% coverage for utilities and services
- **Integration Tests**: Critical user flows covered
- **Component Tests**: Key UI components tested

## Current Test Coverage

Run `npm run test:coverage` to see detailed coverage report.

## CI/CD Integration

Tests are automatically run in GitHub Actions on:
- Push to `main` branch
- Pull requests to `main` branch

See `.github/workflows/ci.yml` for CI configuration.

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Keep Tests Simple**: One assertion per test when possible
3. **Use Descriptive Names**: Test names should describe the expected behavior
4. **Mock External Dependencies**: Always mock API calls and external services
5. **Cleanup**: Use `beforeEach` and `afterEach` for test isolation

## Common Issues

### Tests Timing Out

Increase timeout in test file:
```typescript
it('slow test', async () => {
  // test code
}, { timeout: 10000 }); // 10 seconds
```

### Async Updates

Use `waitFor` for async state updates:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Cleanup Warnings

If you see "not wrapped in act()" warnings, ensure all async operations complete before test ends.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
