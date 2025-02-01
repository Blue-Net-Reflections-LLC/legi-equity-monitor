// This script runs before React hydration and blocks rendering until theme is determined
export function systemThemeScript() {
  return `
    (function() {
      console.debug('[Theme Script] Starting theme initialization');
      let theme = '';
      try {
        // Try to get theme from localStorage
        theme = localStorage.getItem('theme');
        console.debug('[Theme Script] Theme from localStorage:', theme);
      } catch (e) {
        // Handle localStorage errors
        console.error('[Theme Script] Failed to read theme from localStorage:', e);
      }

      // If no saved theme, check system preference
      if (!theme) {
        // Check if user has dark mode at the OS level
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = userPrefersDark ? 'dark' : 'light';
        console.debug('[Theme Script] No saved theme, using system preference:', theme);
      }

      // Immediately set the theme before any content renders
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        console.debug('[Theme Script] Added dark class to document');
      } else {
        console.debug('[Theme Script] Using light theme (no dark class needed)');
      }

      // Store the theme for future reference
      try {
        localStorage.setItem('theme', theme);
        console.debug('[Theme Script] Saved theme to localStorage:', theme);
      } catch (e) {
        console.error('[Theme Script] Failed to save theme to localStorage:', e);
      }

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        console.debug('[Theme Script] System theme change detected:', e.matches ? 'dark' : 'light');
        // Only update if there's no saved preference
        if (!localStorage.getItem('theme')) {
          document.documentElement.classList.toggle('dark', e.matches);
          localStorage.setItem('theme', e.matches ? 'dark' : 'light');
          console.debug('[Theme Script] Updated theme based on system change');
        } else {
          console.debug('[Theme Script] Ignoring system theme change due to saved preference');
        }
      });
      console.debug('[Theme Script] Initialization complete');
    })();
  `;
} 