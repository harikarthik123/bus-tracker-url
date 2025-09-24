import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';
import { onlineManager, QueryClient } from '@tanstack/react-query';

type OutboxItem = {
  id: string;
  url: string;
  method: 'post' | 'put' | 'delete' | 'patch';
  data?: any;
  headers?: Record<string, string>;
  createdAt: number;
};

const STORAGE_KEY = 'write_outbox_v1';
let processing = false;

async function readQueue(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function enqueueRequest(item: Omit<OutboxItem, 'id' | 'createdAt'>): Promise<OutboxItem> {
  const full: OutboxItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now(), ...item };
  const q = await readQueue();
  q.push(full);
  await writeQueue(q);
  // Try immediate processing if online
  if (onlineManager.isOnline()) {
    void processQueue();
  }
  return full;
}

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    let q = await readQueue();
    const next: OutboxItem[] = [];
    for (const item of q) {
      if (!onlineManager.isOnline()) { next.push(item); continue; }
      try {
        const config: AxiosRequestConfig = { method: item.method, url: item.url, data: item.data, headers: item.headers };
        await axios.request(config);
        // success: drop from queue
      } catch (e) {
        // Keep item if network/server error; break on offline
        next.push(item);
      }
    }
    await writeQueue(next);
  } finally {
    processing = false;
  }
}

export function startOutboxProcessor(queryClient: QueryClient) {
  // Process on app start
  void processQueue();
  // Process on reconnect
  onlineManager.subscribe(isOnline => {
    if (isOnline) {
      void processQueue();
    }
  });
}


