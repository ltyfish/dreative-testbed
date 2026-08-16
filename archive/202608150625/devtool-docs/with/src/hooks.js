import { useEffect, useRef, useState } from 'react'

/**
 * Regional entrance. Fires against the top of the viewport so the end state is
 * reached while the region is still on screen, once, never on first paint for
 * anything already visible.
 */
export function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.revealed = 'true'
      return
    }
    // Already on screen at load: no entrance, just be there.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      el.dataset.revealed = 'true'
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = 'true'
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}

/** Which section the reader is currently in, measured against the masthead. */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length) return

    function measure() {
      // Just under the sticky masthead, whatever height it currently is.
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
        10,
      )
      const line = (Number.isFinite(navH) ? navH : 64) + 56
      let current = nodes[0].id
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node.id
      }
      // At the very bottom the last section may never cross the line.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = nodes[nodes.length - 1].id
      }
      setActive(current)
    }

    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [ids])

  return active
}

/**
 * Publishes the sticky masthead's real height as --nav-h so the rail, the
 * scroll offset and the sticky file pane all sit exactly under it at any
 * viewport, instead of guessing.
 */
export function useNavHeight(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () =>
      document.documentElement.style.setProperty('--nav-h', `${Math.round(el.offsetHeight)}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
}

/** Copy-to-clipboard with a short confirmed state, per target. */
export function useCopy() {
  const [copiedKey, setCopiedKey] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function copy(text, key = 'default') {
    try {
      // Denied permission or an insecure origin must not break the button.
      navigator.clipboard?.writeText(text)?.catch(() => {})
    } catch {
      /* clipboard unavailable; the command is still selectable */
    }
    setCopiedKey(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedKey(null), 1600)
  }

  return { copiedKey, copy }
}
