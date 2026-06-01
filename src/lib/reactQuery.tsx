import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React from 'react';
import { FIVE_MINUTES, persister, queryClient } from './queryClient';

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: { shouldDehydrateQuery: () => true },
        maxAge: FIVE_MINUTES, // **crucial**: if cache younger than this, it is reused with stale-while-revalidate
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
