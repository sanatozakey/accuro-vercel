import React, { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
}

export function LazyImage({ src, alt, className = '', placeholder }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver

    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src)
              observer.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: '50px',
        }
      )

      observer.observe(imgRef.current)
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [src])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${imageLoaded ? 'animate-fade-in' : ''}`}
      onLoad={() => setImageLoaded(true)}
      loading="lazy"
    />
  )
}
