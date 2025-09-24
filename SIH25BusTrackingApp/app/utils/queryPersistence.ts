import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from './queryClient';

export function enableQueryPersistence() {
  const persister = createAsyncStoragePersister({ storage: AsyncStorage, throttleTime: 2000 });
  persistQueryClient({ queryClient, persister, maxAge: 24 * 60 * 60 * 1000 });
}


