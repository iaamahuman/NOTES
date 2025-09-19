import NodeCache from 'node-cache';

class CacheManager {
  private cache: NodeCache;
  
  constructor() {
    // Cache configuration
    this.cache = new NodeCache({
      stdTTL: 600, // Standard TTL: 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Don't clone cached objects for better performance
      deleteOnExpire: true,
      enableLogs: process.env.NODE_ENV === 'development'
    });
  }

  // Get cached value
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  // Set cached value with custom TTL
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  // Delete cached value
  delete(key: string): number {
    return this.cache.del(key);
  }

  // Check if key exists
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats();
  }

  // Clear all cache
  clear(): void {
    this.cache.flushAll();
  }

  // Cache with automatic key generation for common patterns
  
  // Cache notes list with filters as key
  async getNotes(
    filters: Record<string, any>,
    fetcher: () => Promise<any[]>
  ): Promise<any[]> {
    const cacheKey = `notes:${JSON.stringify(filters)}`;
    
    let notes = this.get<any[]>(cacheKey);
    if (!notes) {
      notes = await fetcher();
      this.set(cacheKey, notes, 300); // Cache for 5 minutes
    }
    
    return notes;
  }

  // Cache individual note details
  async getNote(id: string, fetcher: () => Promise<any>): Promise<any> {
    const cacheKey = `note:${id}`;
    
    let note = this.get<any>(cacheKey);
    if (!note) {
      note = await fetcher();
      this.set(cacheKey, note, 600); // Cache for 10 minutes
    }
    
    return note;
  }

  // Cache user profile
  async getUser(id: string, fetcher: () => Promise<any>): Promise<any> {
    const cacheKey = `user:${id}`;
    
    let user = this.get<any>(cacheKey);
    if (!user) {
      user = await fetcher();
      this.set(cacheKey, user, 900); // Cache for 15 minutes
    }
    
    return user;
  }

  // Cache platform statistics
  async getStats(fetcher: () => Promise<any>): Promise<any> {
    const cacheKey = 'platform:stats';
    
    let stats = this.get<any>(cacheKey);
    if (!stats) {
      stats = await fetcher();
      this.set(cacheKey, stats, 1800); // Cache for 30 minutes
    }
    
    return stats;
  }

  // Cache search results
  async getSearchResults(
    query: string,
    filters: Record<string, any>,
    fetcher: () => Promise<any>
  ): Promise<any> {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    
    let results = this.get<any>(cacheKey);
    if (!results) {
      results = await fetcher();
      this.set(cacheKey, results, 180); // Cache for 3 minutes (search results change frequently)
    }
    
    return results;
  }

  // Invalidate related caches when data changes
  invalidateNotesCaches(): void {
    const keys = this.cache.keys();
    const notesKeys = keys.filter(key => 
      key.startsWith('notes:') || 
      key.startsWith('search:') ||
      key === 'platform:stats'
    );
    
    notesKeys.forEach(key => this.delete(key));
  }

  invalidateUserCache(userId: string): void {
    this.delete(`user:${userId}`);
    this.invalidateNotesCaches(); // User changes might affect notes display
  }

  invalidateNoteCache(noteId: string): void {
    this.delete(`note:${noteId}`);
    this.invalidateNotesCaches();
  }

  // Middleware for automatic cache invalidation
  createInvalidationMiddleware() {
    return (req: any, res: any, next: any) => {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Invalidate caches on successful data modifications
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            if (req.path.includes('/notes')) {
              cacheManager.invalidateNotesCaches();
            } else if (req.path.includes('/users')) {
              if (req.params?.id) {
                cacheManager.invalidateUserCache(req.params.id);
              }
            }
          }
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Cache middleware for Express routes
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `route:${req.originalUrl}`;
    
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cacheManager.set(cacheKey, data, ttl);
        res.setHeader('X-Cache', 'MISS');
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};