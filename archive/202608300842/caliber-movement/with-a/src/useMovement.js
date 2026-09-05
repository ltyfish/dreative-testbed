import { useEffect, useRef, useState } from 'react'
import { FRAMES, FRAMES_SM } from './frames.js'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

// One decoded image set, shared by every canvas on the route, so the hero and
// the power path are literally the same running movement rather than two
// separate loads of the same files.
let sharedPromise = null
let sharedFrames = null

export function loadFrames(small) {
  if (sharedPromise) return sharedPromise
  const list = small ? FRAMES_SM : FRAMES
  const imgs = list.map((src) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    return img
  })
  sharedPromise = Promise.all(
    imgs.map(
      (img) =>
        new Promise((res) => {
          if (img.complete) return res()
          img.onload = () => res()
          img.onerror = () => res()
        }),
    ),
  ).then(() => {
    sharedFrames = imgs
    return imgs
  })
  return sharedPromise
}

export function getFrames() {
  return sharedFrames
}

// Progress of a tall section through the viewport, measured against the top of
// the viewport so a reveal never resolves behind the reader.
export function useSectionProgress(ref, leadRef) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let queued = false
    const measure = () => {
      queued = false
      const rect = el.getBoundingClientRect()
      // A lead-in band inside the section introduces it and is not part of the
      // scrub; the sequence starts once the pinned stage has taken over.
      const lead = leadRef && leadRef.current ? leadRef.current.offsetHeight : 0
      const travel = rect.height - window.innerHeight - lead
      if (travel <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0)
        return
      }
      const p = Math.min(1, Math.max(0, (-rect.top - lead) / travel))
      setProgress(p)
    }
    const onScroll = () => {
      if (queued) return
      queued = true
      raf.current = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref, leadRef])
  return progress
}
