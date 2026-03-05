# Bitwrench v2 Test Suite

## Overview

The Bitwrench v2 test suite is organized into multiple files to ensure stable CI while documenting areas that need improvement.

## Test Files

### 1. `bitwrench_ci.js` (CI Tests - All Pass)
- **Purpose**: Continuous Integration tests that must always pass
- **Status**: 45 tests, 100% passing
- **Usage**: `npm test` (default for CI/CD)
- **Coverage**: Core functionality that is stable and production-ready

### 2. `bitwrench_test_coverage.js` (Coverage Tests)
- **Purpose**: Extended coverage tests for v2 APIs
- **Status**: 110 tests
- **Usage**: `npm test` (included in default test run)

### 3. `bitwrench_test_pubsub.js` (Pub/Sub Tests)
- **Purpose**: Tests for bw.pub/bw.sub/bw.unsub messaging system
- **Status**: 23 tests
- **Usage**: `npm test` (included in default test run)

### 4. `bitwrench_test_pending.js` (Future Tests - Currently Failing)
- **Purpose**: Document tests that need fixes with explanations
- **Status**: 9 test categories pending implementation
- **Usage**: `npm run test:pending` (skipped by default)
- **Categories**:
  - Cookie Operations (Low priority)
  - Component Registry (Medium priority)
  - Environment Detection (Low priority)
  - Legacy v1 API (High priority)
  - Color Operations (Medium priority)
  - File I/O (Medium priority)
  - DOM Manipulation (High priority)
  - Event System (High priority)
  - Performance (Low priority)

### 5. `bitwrench_test.js` (Legacy v1 Tests)
- **Purpose**: Original v1 test suite
- **Status**: Incompatible with v2 API
- **Usage**: `npm run test:v1`
- **Note**: Kept for reference during migration

## Running Tests

```bash
# Run CI tests (all pass)
npm test

# Run with coverage
npm run test:coverage

# Run pending tests (will fail - for documentation)
npm run test:pending

# Run all unit tests
npm run test:all-unit

# Run E2E tests
npm run test:e2e

# Show test summary with version and pass rates
npm run test:summary
```

## Test Philosophy

1. **CI Stability**: The default `npm test` runs only stable, passing tests
2. **Documentation**: Failing tests are documented with reasons and fix priorities
3. **Progressive Enhancement**: As pending tests are fixed, they move to CI suite
4. **Clear Separation**: No failing tests in CI prevents "broken window" syndrome

## Coverage

Tests use c8 for coverage reporting. The `npm test` command includes coverage via c8.

## E2E Tests

Playwright E2E tests validate all example pages and the state-debug page:
- `tests/examples.spec.js` - Example page tests
- `test/state-debug.spec.js` - State management tests
- `test/mounted-pattern.spec.js` - Mounted pattern tests
- `test/visual.spec.js` - Visual regression tests

## Future Improvements

1. Fix high-priority pending tests (Event System, DOM Manipulation, Legacy API)
2. Improve coverage percentages
3. Add performance benchmarks
4. Implement integration tests for component interactions
