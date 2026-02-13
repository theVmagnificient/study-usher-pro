/**
 * BatchLoader - Utility for batching and deduplicating API requests
 *
 * Collects multiple load() calls and executes them in a single batch
 * after a short delay. Useful for avoiding N+1 query patterns.
 *
 * Example:
 *   const loader = new BatchLoader(
 *     async (ids) => fetchMultipleItems(ids),
 *     cache
 *   )
 *
 *   // These calls are batched together
 *   const item1 = await loader.load(1)
 *   const item2 = await loader.load(2)
 *   const item3 = await loader.load(3)
 */

interface CacheAdapter<T> {
  get(id: number): T | undefined
  set(item: T): void
}

interface PendingRequest<T> {
  resolve: (value: T | undefined) => void
  reject: (error: Error) => void
}

export class BatchLoader<T extends { id: number }> {
  private queue: Map<number, PendingRequest<T>> = new Map()
  private timer: NodeJS.Timeout | null = null
  private readonly delay: number

  constructor(
    private fetcher: (ids: number[]) => Promise<Map<number, T>>,
    private cache: CacheAdapter<T>,
    delay = 50
  ) {
    this.delay = delay
  }

  /**
   * Load a single item by ID, batching with other concurrent requests
   */
  async load(id: number): Promise<T | undefined> {
    // Check cache first
    const cached = this.cache.get(id)
    if (cached) {
      return cached
    }

    // Return existing promise if already queued
    const existing = this.queue.get(id)
    if (existing) {
      return new Promise((resolve, reject) => {
        const originalResolve = existing.resolve
        const originalReject = existing.reject

        existing.resolve = (value) => {
          originalResolve(value)
          resolve(value)
        }
        existing.reject = (error) => {
          originalReject(error)
          reject(error)
        }
      })
    }

    // Add to batch queue
    return new Promise<T | undefined>((resolve, reject) => {
      this.queue.set(id, { resolve, reject })

      // Debounce: wait for more IDs to accumulate
      if (this.timer) {
        clearTimeout(this.timer)
      }

      this.timer = setTimeout(() => {
        this.executeBatch()
      }, this.delay)
    })
  }

  /**
   * Execute the batched requests
   */
  private async executeBatch(): Promise<void> {
    if (this.queue.size === 0) return

    const ids = Array.from(this.queue.keys())
    const requests = new Map(this.queue)
    this.queue.clear()
    this.timer = null

    try {
      const results = await this.fetcher(ids)

      // Cache and resolve all results
      for (const [id, request] of requests) {
        const item = results.get(id)

        if (item) {
          this.cache.set(item)
          request.resolve(item)
        } else {
          request.resolve(undefined)
        }
      }
    } catch (error) {
      // Reject all pending requests
      for (const request of requests.values()) {
        request.reject(error as Error)
      }
    }
  }

  /**
   * Clear any pending batches (useful for cleanup)
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.queue.clear()
  }
}
