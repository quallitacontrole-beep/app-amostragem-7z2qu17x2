export type DataSource = 'DB' | 'MOCK'

export interface RequestMetric {
  id: string
  timestamp: string
  source: DataSource
  latency: number
  operation: string
  error: boolean
}

class MetricsStore {
  private requests: RequestMetric[] = []
  private errors: { time: string; msg: string }[] = []
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  getState() {
    return {
      requests: this.requests,
      errors: this.errors,
      addRequest: this.addRequest.bind(this),
      addError: this.addError.bind(this),
      clear: this.clear.bind(this),
    }
  }

  addRequest(req: Omit<RequestMetric, 'id' | 'timestamp'>) {
    const newReq = {
      ...req,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    }
    this.requests = [newReq, ...this.requests].slice(0, 100) // Keep last 100 requests
    this.notify()
  }

  addError(msg: string) {
    this.errors = [{ time: new Date().toISOString(), msg }, ...this.errors].slice(0, 50)
    this.notify()
  }

  clear() {
    this.requests = []
    this.errors = []
    this.notify()
  }
}

export const metricsStore = new MetricsStore()

export const useMetricsStore = {
  getState: () => metricsStore.getState(),
}
