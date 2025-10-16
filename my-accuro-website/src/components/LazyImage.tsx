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
    const currentImg = imgRef.current

    if (currentImg) {
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

      observer.observe(currentImg)
    }

    return () => {
      if (observer && currentImg) {
        observer.unobserve(currentImg)
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
