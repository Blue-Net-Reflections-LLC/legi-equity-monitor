'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'icon' | 'labeled'
  showTooltip?: boolean
}

export function ThemeToggle({ variant = 'icon', showTooltip = false }: ThemeToggleProps) {
  // Start with no theme state to match server rendering
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Only run theme detection after mount to prevent hydration mismatch
    setMounted(true)
    const theme = document.documentElement.classList.contains('dark')
    setIsDark(theme)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e)
    }
  }

  // Don't render anything until after hydration to prevent mismatch
  if (!mounted) {
    return null
  }

  if (variant === 'labeled') {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {isDark ? (
          <>
            <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Switch to Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Switch to Dark Mode</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      )}
      {showTooltip && (
        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-zinc-800 rounded whitespace-nowrap">
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </div>
      )}
    </button>
  )
} 