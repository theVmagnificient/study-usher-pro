import type { User, Client, ClientType } from '@/types/api'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class LookupCache {
  private users = new Map<number, CacheEntry<User>>()
  private clients = new Map<number, CacheEntry<Client>>()
  private clientTypes = new Map<number, CacheEntry<ClientType>>()


  private readonly TTL = 5 * 60 * 1000


  setUser(user: User): void {
    this.users.set(user.id, {
      data: user,
      timestamp: Date.now(),
    })
  }

  getUser(id: number): User | undefined {
    const entry = this.users.get(id)
    if (!entry) return undefined


    if (Date.now() - entry.timestamp > this.TTL) {
      this.users.delete(id)
      return undefined
    }

    return entry.data
  }

  setUsers(users: User[]): void {
    users.forEach(user => this.setUser(user))
  }


  setClient(client: Client): void {
    this.clients.set(client.id, {
      data: client,
      timestamp: Date.now(),
    })
  }

  getClient(id: number): Client | undefined {
    const entry = this.clients.get(id)
    if (!entry) return undefined


    if (Date.now() - entry.timestamp > this.TTL) {
      this.clients.delete(id)
      return undefined
    }

    return entry.data
  }

  setClients(clients: Client[]): void {
    clients.forEach(client => this.setClient(client))
  }


  setClientType(clientType: ClientType): void {
    this.clientTypes.set(clientType.id, {
      data: clientType,
      timestamp: Date.now(),
    })
  }

  getClientType(id: number): ClientType | undefined {
    const entry = this.clientTypes.get(id)
    if (!entry) return undefined


    if (Date.now() - entry.timestamp > this.TTL) {
      this.clientTypes.delete(id)
      return undefined
    }

    return entry.data
  }

  setClientTypes(clientTypes: ClientType[]): void {
    clientTypes.forEach(ct => this.setClientType(ct))
  }


  clearUsers(): void {
    this.users.clear()
  }

  clearClients(): void {
    this.clients.clear()
  }

  clearClientTypes(): void {
    this.clientTypes.clear()
  }

  clearAll(): void {
    this.clearUsers()
    this.clearClients()
    this.clearClientTypes()
  }


  cleanExpired(): void {
    const now = Date.now()


    for (const [id, entry] of this.users.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.users.delete(id)
      }
    }


    for (const [id, entry] of this.clients.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.clients.delete(id)
      }
    }


    for (const [id, entry] of this.clientTypes.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.clientTypes.delete(id)
      }
    }
  }


  getStats() {
    return {
      users: this.users.size,
      clients: this.clients.size,
      clientTypes: this.clientTypes.size,
    }
  }
}


export const lookupCache = new LookupCache()


if (typeof window !== 'undefined') {
  setInterval(() => {
    lookupCache.cleanExpired()
    console.log('Cache cleaned:', lookupCache.getStats())
  }, 5 * 60 * 1000)
}
