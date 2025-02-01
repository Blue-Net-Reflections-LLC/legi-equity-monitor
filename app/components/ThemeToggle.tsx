'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'icon' | 'labeled'
  showTooltip?: boolean
}

export function ThemeToggle({ variant = 'icon', showTooltip = false }: ThemeToggleProps) {
  console.debug('[ThemeToggle] Component rendering');
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    console.debug('[ThemeToggle] useEffect running');
    // Initialize theme state from localStorage or system preference
    const theme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    console.debug('[ThemeToggle] Initial theme:', theme);
    setIsDark(theme === 'dark');

    // Listen for system theme changes only if no saved preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      console.debug('[ThemeToggle] System theme change:', e.matches ? 'dark' : 'light');
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      console.debug('[ThemeToggle] Cleaning up event listener');
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const toggleTheme = () => {
    console.debug('[ThemeToggle] Toggle theme clicked, current isDark:', isDark);
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Update DOM and localStorage
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    console.debug('[ThemeToggle] Theme updated to:', newTheme ? 'dark' : 'light');
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