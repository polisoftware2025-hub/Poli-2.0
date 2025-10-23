
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import { useEffect } from 'react';
import Script from 'next/script';

const metadata: Metadata = {
  title: "Politécnico Internacional",
  description:
    "Formando profesionales con calidad y compromiso para los retos del mundo actual.",
};

// This function string will be stringified and injected into the Script tag.
const themeLoaderScript = `
  (function() {
    try {
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        
        // Apply theme mode
        if (prefs.themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Apply styles
        const root = document.documentElement;
        if(prefs.primaryColor) root.style.setProperty('--primary-hue', prefs.primaryColor.hue);
        if(prefs.primaryColor) root.style.setProperty('--primary-saturation', prefs.primaryColor.saturation + '%');
        if(prefs.primaryColor) root.style.setProperty('--primary-lightness', prefs.primaryColor.lightness + '%');
        
        if(prefs.accentColor) root.style.setProperty('--accent-hue', prefs.accentColor.hue);
        if(prefs.accentColor) root.style.setProperty('--accent-saturation', prefs.accentColor.saturation + '%');
        if(prefs.accentColor) root.style.setProperty('--accent-lightness', prefs.accentColor.lightness + '%');

        if(prefs.fontFamily) root.style.setProperty('--font-family', prefs.fontFamily);
        if(prefs.fontSize) root.style.setProperty('--global-font-size', prefs.fontSize);
        if(prefs.borderRadius) root.style.setProperty('--radius', prefs.borderRadius + 'rem');
        if(prefs.blurIntensity) root.style.setProperty('--blur-intensity', prefs.blurIntensity + 'px');
        if(prefs.cardStyle) root.setAttribute('data-card-style', prefs.cardStyle);
        if(prefs.animationsEnabled !== undefined) root.setAttribute('data-animations-enabled', prefs.animationsEnabled);
        
      } else {
        // Default to system preference if no settings saved
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (e) {
      console.error('Failed to load user preferences:', e);
    }
  })();
`;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es" className="!scroll-smooth" suppressHydrationWarning>
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script id="theme-loader" strategy="beforeInteractive">
          {themeLoaderScript}
        </Script>
      </head>
      <body className="font-roboto antialiased" suppressHydrationWarning>
        <UserPreferencesProvider>
            {children}
        </UserPreferencesProvider>
        <Toaster />
      </body>
    </html>
  );
}
