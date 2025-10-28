"use client";

import { useEffect } from 'react';

/**
 * Este componente no renderiza nada. Su único propósito es detectar el tema
 * del sistema operativo (claro u oscuro) y aplicar la clase correspondiente
 * al elemento <html> para que los estilos de Tailwind CSS funcionen.
 */
export function PublicThemeHandler() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark: boolean) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
    };

    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches);
    };

    // Aplicar el tema inicial
    applyTheme(mediaQuery.matches);

    // Escuchar cambios
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return null;
}
