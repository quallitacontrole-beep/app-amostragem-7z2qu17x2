import { useState, useEffect } from 'react'

export interface RequestMetric {
  id: string
  source: 'DB' | 'MOCK'
  latency: number
  operation: string
  timestamp: string
  error: boolean
}

type Listener = () => void

class MetricsStore {
  requests: RequestMetric[] = []
  errors: string[] = []
  private listeners: Set<Listener> = new Set()

  addRequest(metric: Omit<RequestMetric, 'id' | 'timestamp'>) {
    this.requests = [
      {
        ...metric,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      },
      ...this.requests,
    ].slice(0, 1000)
    this.notify()
  }

  addError(error: string) {
    this.errors = [error, ...this.errors].slice(0, 100)
    this.notify()
  }

  clear() {
    this.requests = []
    this.errors = []
    this.notify()
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }
}

export const metricsStore = new MetricsStore()

export function useMetrics() {
  const [state, setState] = useState({
    requests: metricsStore.requests,
    errors: metricsStore.errors,
  })

  useEffect(() => {
    return metricsStore.subscribe(() => {
      setState({ requests: metricsStore.requests, errors: metricsStore.errors })
    })
  }, [])

  return state
}
