interface CacheItem<T> {
  value: T;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheItem<unknown>> = new Map();

  // Set item in cache with expiration time in seconds
  set<T>(key: string, value: T, expiryInSeconds: number = 3600): void {
    const expiry = Date.now() + expiryInSeconds * 1000;
    this.cache.set(key, {value, expiry});
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    // Not found
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }

  // Remove a specific item
  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const cache = new CacheService();
