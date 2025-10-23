
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Script from 'next/script';

const metadata: Metadata = {
  title: "Politécnico Internacional",
  description:
    "Formando profesionales con calidad y compromiso para los retos del mundo actual.",
};

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
            setVar('--primary-hue', prefs.primaryColor.hue);
            setVar('--primary-saturation', prefs.primaryColor.saturation + '%');
            setVar('--primary-lightness', prefs.primaryColor.lightness + '%');
        }
        if (prefs.accentColor) {
             setVar('--accent-hue', prefs.accentColor.hue);
             setVar('--accent-saturation', prefs.accentColor.saturation + '%');
             setVar('--accent-lightness', prefs.accentColor.lightness + '%');
        }
        if(prefs.fontFamily) setVar('--font-family', prefs.fontFamily);
        if(prefs.fontSize) setVar('--global-font-size', prefs.fontSize);
        if(prefs.fontWeight) setVar('--font-weight', prefs.fontWeight);
        if(prefs.letterSpacing) setVar('--letter-spacing', prefs.letterSpacing);
        if(prefs.borderRadius) setVar('--radius', prefs.borderRadius + 'rem');
        if(prefs.blurIntensity) setVar('--blur-intensity', prefs.blurIntensity + 'px');
        
        root.setAttribute('data-card-style', prefs.cardStyle || 'glass');
        root.setAttribute('data-animations-enabled', String(prefs.animationsEnabled));
        root.setAttribute('data-show-shadows', String(prefs.showShadows));

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs only once on the client after hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Simulate loading time
    return () => clearTimeout(timer);
  }, []);

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
        <AnimatePresence>
            {isLoading && (
                 <motion.div
                    key="loader"
                    className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center p-4 polygon-bg overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
                        <div className="wheel"></div>
                        <div className="hamster">
                            <div className="hamster__body">
                                <div className="hamster__head">
                                    <div className="hamster__ear"></div>
                                    <div className="hamster__eye"></div>
                                    <div className="hamster__nose"></div>
                                </div>
                                <div className="hamster__limb hamster__limb--fr"></div>
                                <div className="hamster__limb hamster__limb--fl"></div>
                                <div className="hamster__limb hamster__limb--br"></div>
                                <div className="hamster__limb hamster__limb--bl"></div>
                                <div className="hamster__tail"></div>
                            </div>
                        </div>
                        <div className="spoke"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        <UserPreferencesProvider>
            {!isLoading && children}
        </UserPreferencesProvider>
        <Toaster />
      </body>
    </html>
  );
}
