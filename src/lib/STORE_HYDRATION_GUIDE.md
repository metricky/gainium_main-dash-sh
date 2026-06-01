# Store Hydration Utilities

This guide explains how to handle IndexedDB hydration timing issues with Zustand stores.

## Problem

When using Zustand stores with IndexedDB persistence, accessing store data immediately after app startup may return default/empty values because the IndexedDB hasn't finished loading the persisted data yet.

## Solution

Use the `waitForStoreHydration` utilities to ensure data is loaded before accessing it.

## Available Utilities

### 1. `waitForUsdRateStoreHydration`

Wait for USD rate store to be hydrated:

```typescript
import { waitForUsdRateStoreHydration } from '@/lib/storeUtils';
import { useUsdRateStore } from '@/stores/usdRateStore';

// ❌ Bad - might return 0 even if rate exists in IndexedDB
const rate = useUsdRateStore.getState().rate;

// ✅ Good - waits for IndexedDB to load
const rate = await waitForUsdRateStoreHydration(useUsdRateStore);
```

### 2. `waitForUserFeesStoreHydration`

Wait for user fees store to be hydrated:

```typescript
import { waitForUserFeesStoreHydration } from '@/lib/storeUtils';
import { useUserFeesStore } from '@/stores/userFeesStore';

// ❌ Bad - might return empty object even if fees exist in IndexedDB
const fees = useUserFeesStore.getState().fees;

// ✅ Good - waits for IndexedDB to load
const state = await waitForUserFeesStoreHydration(useUserFeesStore);
const fees = state.fees;
```

### 3. Generic `waitForStoreHydration`

For other stores with IndexedDB persistence:

```typescript
import { waitForStoreHydration } from '@/lib/storeUtils';

const hydratedState = await waitForStoreHydration(
  myStore,
  'my-store-name',
  (state) => state.timestamp > 0, // Custom hydration check
  5000 // Custom timeout (optional)
);
```

## Usage in Components

### React Hook Pattern

```typescript
import { useEffect, useState } from 'react';
import { waitForUsdRateStoreHydration } from '@/lib/storeUtils';
import { useUsdRateStore } from '@/stores/usdRateStore';

function MyComponent() {
  const [usdRate, setUsdRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsdRate = async () => {
      try {
        const rate = await waitForUsdRateStoreHydration(useUsdRateStore);
        setUsdRate(rate);
      } catch (error) {
        console.error('Failed to load USD rate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsdRate();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return <div>USD Rate: {usdRate}</div>;
}
```

### Utility Functions

For utility functions (like the price helper), use the await pattern:

```typescript
// In a utility function
export async function calculatePrice() {
  // Wait for USD rate to be available
  const usdRate = await waitForUsdRateStoreHydration(useUsdRateStore);

  // Now safely use the rate
  return someValue * usdRate;
}
```

## Implementation Details

- **Timeout**: Default 3 seconds, customizable
- **Performance**: Caches hydration status to avoid repeated waits
- **Fallback**: Returns default values if hydration fails
- **Logging**: Provides debug information for troubleshooting

## When to Use

Use these utilities when:

- ✅ Accessing store data on app startup
- ✅ In utility functions that run early
- ✅ When store data is critical for calculations
- ❌ Not needed in React components using store hooks (they handle hydration automatically)
- ❌ Not needed for non-persisted stores (they don't use IndexedDB)
