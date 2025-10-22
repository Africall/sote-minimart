
import { QueryClient } from '@tanstack/react-query';

// Create a query client with minimal caching settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately considered stale
      gcTime: 30 * 1000, // Cache data for only 30 seconds before garbage collection
      retry: 1, // Reduce retry attempts to minimize network requests
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      refetchOnMount: true, // Always refetch when component mounts
    },
    mutations: {
      retry: 1, // Reduce retry attempts for mutations
    },
  },
});
