import { useEffect, useState } from 'react'

// Keeps a dialog/popup mounted long enough to play its CSS exit transition
// instead of vanishing the instant `isOpen` flips to false. Pass `visible`
// as a modifier class (e.g. `${visible ? ' my-overlay--visible' : ''}`)
// alongside a CSS transition declared on that class; gate the JSX return on
// `shouldRender`, which only goes false once the closing transition ends.
export function useMountTransition(isOpen: boolean, durationMs = 300) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Double rAF, not single — a single rAF callback still fires before
      // the browser's next paint, so the closed state and the --visible
      // state can land in the SAME frame (no transition to see). Waiting
      // an extra frame guarantees the closed state actually paints first.
      let innerFrame = 0
      const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
      }
    }
    setVisible(false)
    const timer = window.setTimeout(() => setShouldRender(false), durationMs)
    return () => window.clearTimeout(timer)
  }, [isOpen, durationMs])

  return { shouldRender, visible }
}

// Companion for dialogs whose content is driven by a value that goes
// null/undefined right when closing starts (e.g. `trimSong` below) — holds
// onto the last non-nullish value so the fade-out has something to render.
export function useLastValue<T>(value: T | null | undefined): T | undefined {
  const [lastValue, setLastValue] = useState(value ?? undefined)

  useEffect(() => {
    if (value != null) setLastValue(value)
  }, [value])

  return lastValue
}
