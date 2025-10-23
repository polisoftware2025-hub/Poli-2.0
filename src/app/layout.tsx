
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";

const metadata: Metadata = {
  title: "Politécnico Internacional",
  description:
    "Formando profesionales con calidad y compromiso para los retos del mundo actual.",
};

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
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat&family=Exo+2:wght@400;600;700&family=IBM+Plex+Mono&family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Lobster&family=Lora&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Orbitron:wght@400;700&family=Oswald&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;500;600;700&family=Press+Start+2P&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@400;500;700&family=Teko&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
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
