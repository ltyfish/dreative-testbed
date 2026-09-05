import { useEffect, useLayoutEffect, useRef } from 'react'
import { applyView } from './loupe.js'

// A framed region of the one photograph. The frame is the same object the power
// path travels inside; here it holds still and the region eases between states.
export default function Plate({ view, className = '', alt, children, small = false }) {
  const box = useRef(null)
  const img = useRef(null)

  useLayoutEffect(() => {
    applyView(img.current, box.current, view)
  }, [view])

  useEffect(() => {
    const onResize = () => applyView(img.current, box.current, view)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [view])

  return (
    <div className={`plate ${className}`} ref={box}>
      <img
        ref={img}
        className="plate-img is-eased"
        src={small ? '/media/plate-sm.jpg' : '/media/plate.jpg'}
        srcSet={small ? undefined : '/media/plate-sm.jpg 1500w, /media/plate.jpg 4000w'}
        sizes={small ? undefined : '(max-width: 900px) 100vw, 60vw'}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      {children}
    </div>
  )
}
