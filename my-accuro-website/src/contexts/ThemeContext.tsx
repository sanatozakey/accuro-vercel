import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [userExplicitlySet, setUserExplicitlySet] = useState(() => {
    return localStorage.getItem('theme') !== null
  })

  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      return savedTheme
    }
    // Detect OS preference when no localStorage value exists
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Save to localStorage only if user explicitly set it
    if (userExplicitlySet) {
      localStorage.setItem('theme', theme)
    }
  }, [theme, userExplicitlySet])

  // Listen for OS theme changes (only if user hasn't explicitly toggled)
  useEffect(() => {
    if (userExplicitlySet) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [userExplicitlySet])

  const toggleTheme = () => {
    setUserExplicitlySet(true)
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme: Theme) => {
    setUserExplicitlySet(true)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
