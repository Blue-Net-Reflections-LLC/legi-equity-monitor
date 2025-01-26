// This script runs before React hydration
export function systemThemeScript() {
  return `
    (function() {
      function getTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) return savedTheme

        // Fall back to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      
      function updateTheme() {
        const theme = getTheme()
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }

      // Set initial theme
      updateTheme()

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if there's no saved preference
        if (!localStorage.getItem('theme')) {
          document.documentElement.classList.toggle('dark', e.matches)
        }
      })
    })()
  `
} 