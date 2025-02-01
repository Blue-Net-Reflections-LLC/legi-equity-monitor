// This script runs before React hydration and blocks rendering until theme is determined
export function systemThemeScript() {
  return `
    (function() {
      let theme = '';
      try {
        // Try to get theme from localStorage
        theme = localStorage.getItem('theme');
      } catch (e) {
        // Handle localStorage errors
        console.error('Failed to read theme from localStorage:', e);
      }

      // If no saved theme, check system preference
      if (!theme) {
        // Check if user has dark mode at the OS level
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = userPrefersDark ? 'dark' : 'light';
      }

      // Immediately set the theme before any content renders
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }

      // Store the theme for future reference
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        console.error('Failed to save theme to localStorage:', e);
      }

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if there's no saved preference
        if (!localStorage.getItem('theme')) {
          document.documentElement.classList.toggle('dark', e.matches);
          localStorage.setItem('theme', e.matches ? 'dark' : 'light');
        }
      });
    })();
  `;
} 