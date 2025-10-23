
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
        
        const root = document.documentElement;

        if (prefs.themeMode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        if (prefs.density) {
            document.body.classList.add('density-' + prefs.density);
        }

        const setVar = (key, value) => root.style.setProperty(key, value);
        
        if (prefs.primaryColor) {
            setVar('--primary', \`hsl(\${prefs.primaryColor.hue}, \${prefs.primaryColor.saturation}%, \${prefs.primaryColor.lightness}%)\`);
        }
        if (prefs.accentColor) {
             setVar('--accent', \`hsl(\${prefs.accentColor.hue}, \${prefs.accentColor.saturation}%, \${prefs.accentColor.lightness}%)\`);
        }
        if(prefs.fontFamily) setVar('--font-family', prefs.fontFamily);
        if(prefs.fontSize) setVar('--global-font-size', prefs.fontSize);
        if(prefs.borderRadius) setVar('--radius', prefs.borderRadius + 'rem');
        if(prefs.blurIntensity) setVar('--blur-intensity', prefs.blurIntensity + 'px');
        
        root.setAttribute('data-card-style', prefs.cardStyle || 'glass');
        root.setAttribute('data-animations-enabled', String(prefs.animationsEnabled));
        
      } else {
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
