import { useState, useEffect } from 'react'
import { metricsStore } from '@/stores/metrics'

export function useMetrics() {
  const [state, setState] = useState(metricsStore.getState())

  useEffect(() => {
    return metricsStore.subscribe(() => {
      setState(metricsStore.getState())
    })
  }, [])

  return state
}
