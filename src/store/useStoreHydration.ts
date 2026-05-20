"use client"

import { useState, useEffect } from "react"

export function useStoreHydration<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F
): F | undefined {
  const result = store(callback) as F
  const [hydratedValue, setHydratedValue] = useState<F | undefined>(undefined)

  useEffect(() => {
    setHydratedValue(result)
  }, [result])

  return hydratedValue
}
