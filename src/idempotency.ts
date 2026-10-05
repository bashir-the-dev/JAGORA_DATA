import crypto from 'crypto';

export interface IdempotencyRecord {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  statusCode?: number;
  responseBody?: any;
  createdAt: number;
}

class IdempotencyEngine {
  private cache = new Map<string, IdempotencyRecord>();
  private readonly TTL_MS = 15 * 60 * 1000; // 15 minutes cache

  public buildKey(prefix: string, userId: string, payload: any, customKey?: string): string {
    if (customKey && typeof customKey === 'string' && customKey.trim().length > 0) {
      return `idemp:${prefix}:${customKey.trim()}`;
    }

    // Hash the payload components + 30-second window to prevent rapid double-clicks
    const timeWindow = Math.floor(Date.now() / 30000);
    const serialized = JSON.stringify(payload || {});
    const hash = crypto.createHash('sha256').update(`${userId}:${serialized}:${timeWindow}`).digest('hex').slice(0, 24);
    return `idemp:${prefix}:${userId}:${hash}`;
  }

  public acquire(key: string): { allowed: boolean; status?: 'PENDING' | 'COMPLETED' | 'FAILED'; cachedResponse?: any; statusCode?: number } {
    this.cleanExpired();
    const existing = this.cache.get(key);

    if (!existing) {
      this.cache.set(key, { status: 'PENDING', createdAt: Date.now() });
      return { allowed: true };
    }

    if (existing.status === 'PENDING') {
      return {
        allowed: false,
        status: 'PENDING'
      };
    }

    if (existing.status === 'COMPLETED') {
      return {
        allowed: false,
        status: 'COMPLETED',
        cachedResponse: existing.responseBody,
        statusCode: existing.statusCode || 200
      };
    }

    // If previously failed, allow retry
    this.cache.set(key, { status: 'PENDING', createdAt: Date.now() });
    return { allowed: true };
  }

  public complete(key: string, statusCode: number, responseBody: any): void {
    this.cache.set(key, {
      status: 'COMPLETED',
      statusCode,
      responseBody,
      createdAt: Date.now()
    });
  }

  public release(key: string, errorResponse?: any): void {
    if (errorResponse) {
      this.cache.set(key, {
        status: 'FAILED',
        responseBody: errorResponse,
        createdAt: Date.now()
      });
    } else {
      this.cache.delete(key);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now - record.createdAt > this.TTL_MS) {
        this.cache.delete(key);
      }
    }
  }
}

export const idempotency = new IdempotencyEngine();
