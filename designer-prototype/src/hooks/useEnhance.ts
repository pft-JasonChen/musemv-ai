import { useState } from 'react'

// Figma "List Input / Processing" (node 1343:23937) — while an Enhance
// request is "in flight" for a given textarea, its Enhance icon swaps to a
// spinning ic_refresh and the rest of the input box (textarea, other
// buttons, char count) dims to look disabled, for ~1s, before the text is
// replaced. Keyed so a page with more than one prompt textarea (e.g. the 4
// Storyboard scenes) can enhance each one independently. Shared by every
// "Describe your..." textarea across MV Create, Song Create, MV Storyboard,
// and MV Edit, since they all follow this exact same behavior.
export function useEnhance() {
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())

  function isEnhancing(key: string) {
    return pendingKeys.has(key)
  }

  function enhance(key: string, apply: () => void) {
    if (pendingKeys.has(key)) return
    setPendingKeys((current) => new Set(current).add(key))
    setTimeout(() => {
      apply()
      setPendingKeys((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }, 1000)
  }

  return { isEnhancing, enhance }
}
