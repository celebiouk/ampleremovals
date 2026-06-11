import { QueryClient, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";
import { encryptedStorage } from "./secure-storage";

/**
 * Offline-first data layer.
 *
 * - The query cache is persisted to the phone's local storage (AsyncStorage),
 *   so the app opens and shows the last-known data even with no internet.
 * - When the device is online again, React Query refetches in the background,
 *   swaps in the fresh data, and re-saves it — evicting the stale copy.
 */

// Tell React Query whether we're online, based on the real device network.
onlineManager.setEventListener((setOnline) => {
  const sub = NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
  return () => sub();
});

const WEEK = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // treat data as fresh for 30s, then refetch when used
      gcTime: WEEK, // keep cached data around for a week so offline still works
      retry: 2,
      refetchOnReconnect: true, // pull fresh data the moment internet returns
      refetchOnWindowFocus: false,
    },
  },
});

// Serialises the cache to AES-encrypted local storage (throttled so writes
// aren't excessive). The data is unreadable at rest on the device.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: encryptedStorage,
  key: "AMPLE_ADMIN_QUERY_CACHE",
  throttleTime: 1000,
});

/** Bump this to invalidate ALL persisted caches after a breaking data change. */
export const PERSIST_BUSTER = "v2-enc";

/** How long a restored cache is allowed to be before it's discarded entirely. */
export const PERSIST_MAX_AGE = WEEK;
