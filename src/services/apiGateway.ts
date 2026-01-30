import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'

interface ApiRequest<TData = unknown> {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: TData
  headers?: Record<string, string>
  retries?: number
  timeout?: number
}

interface ApiResponse<T = unknown> {
  data: T
  status: number
  success: boolean
  error?: string
  metrics: {
    responseTime: number
    retryCount: number
    cached: boolean
  }
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class ApiGateway {
  private baseUrl: string
  private rateLimits = new Map<string, { count: number; resetTime: number }>()
  private cache = new Map<string, { data: unknown; expiry: number }>()
  private requestQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  }

  // Rate limiting
  private checkRateLimit(endpoint: string, config?: RateLimitConfig): boolean {
    if (!config) return true

    const key = endpoint
    const now = Date.now()
    const limit = this.rateLimits.get(key)

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return true
    }

    if (limit.count >= config.maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  // Request caching
  private getCacheKey(request: ApiRequest): string {
    return `${request.method}:${request.endpoint}:${JSON.stringify(request.data)}`
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: unknown, ttlMs = 300000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }

  // Request retry logic with 401 refresh token handling
  private async executeWithRetry(
    requestFn: () => Promise<Response>,
    retries = 3
  ): Promise<Response> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await requestFn()
        
        // Handle 401 - attempt token refresh
        if (response.status === 401 && attempt === 0) {
          logger.debug('Received 401, attempting token refresh', 'api')
          const { data: { session } } = await supabase.auth.refreshSession()
          if (session) {
            logger.debug('Token refreshed successfully, retrying request', 'api')
            continue // Retry with new token
          }
        }
        
        if (response.ok || attempt === retries) {
          return response
        }
      } catch (error) {
        lastError = error as Error
        if (attempt === retries) break
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }

    throw lastError ?? new Error('Request failed after retries')
  }

  // Request queue management
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return

    this.isProcessingQueue = true
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      if (request) {
        try {
          await request()
        } catch (error) {
          logger.error('Queue request failed', error, 'api')
        }
      }
    }

    this.isProcessingQueue = false
  }

  // Main request method
  async request<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(request)
    
    // Check cache for GET requests
    if (request.method === 'GET') {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        return {
          data: cached,
          status: 200,
          success: true,
          metrics: {
            responseTime: Date.now() - startTime,
            retryCount: 0,
            cached: true
          }
        }
      }
    }

    // Rate limiting check
    if (!this.checkRateLimit(request.endpoint)) {
      throw new Error('Rate limit exceeded')
    }

    try {
      const response = await this.executeWithRetry(async () => {
        const controller = new AbortController()
        const timeout = request.timeout || 30000

        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const fetchResponse = await fetch(`${this.baseUrl}${request.endpoint}`, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        return fetchResponse
      }, request.retries)

      const data = await response.json()

      // Cache successful GET requests
      if (request.method === 'GET' && response.ok) {
        this.setCache(cacheKey, data)
      }

      return {
        data,
        status: response.status,
        success: response.ok,
        error: response.ok ? undefined : data.message,
        metrics: {
          responseTime: Date.now() - startTime,
          retryCount: request.retries || 0,
          cached: false
        }
      }
    } catch (error) {
      return {
        data: null as T,
        status: 500,
        success: false,
        error: (error as Error).message,
        metrics: {
          responseTime: Date.now() - startTime,
          retryCount: request.retries || 0,
          cached: false
        }
      }
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'GET', headers })
  }

  async post<T, TData = unknown>(endpoint: string, data?: TData, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'POST', data, headers })
  }

  async put<T, TData = unknown>(endpoint: string, data?: TData, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'PUT', data, headers })
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'DELETE', headers })
  }

  // Batch requests
  async batch<T>(requests: ApiRequest[]): Promise<ApiResponse<T>[]> {
    return Promise.all(requests.map(request => this.request<T>(request)))
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get API metrics
  getMetrics() {
    return {
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.length,
      rateLimits: Object.fromEntries(this.rateLimits)
    }
  }
}

export const apiGateway = new ApiGateway()
export type { ApiRequest, ApiResponse, RateLimitConfig }