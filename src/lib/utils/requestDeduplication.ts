

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private readonly CLEANUP_THRESHOLD = 1000


  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {

    const existing = this.pendingRequests.get(key)
    if (existing) {
      console.log(`Deduplicating request: ${key}`)
      return existing.promise as Promise<T>
    }


    const promise = fn()
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    try {
      const result = await promise
      this.pendingRequests.delete(key)
      return result
    } catch (error) {
      this.pendingRequests.delete(key)
      throw error
    }
  }


  cleanup(): void {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.CLEANUP_THRESHOLD) {
        this.pendingRequests.delete(key)
      }
    }
  }


  getPendingCount(): number {
    return this.pendingRequests.size
  }


  clear(): void {
    this.pendingRequests.clear()
  }
}


export const requestDeduplicator = new RequestDeduplicator()


if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup()
  }, 5000)
}


export function createRequestKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint


  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  return `${endpoint}:${JSON.stringify(sortedParams)}`
}
