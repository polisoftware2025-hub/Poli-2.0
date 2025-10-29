
"use client";

import React, { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Types and Interfaces ---

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Texto opcional a mostrar debajo del loader.
   */
  text?: string;
  /**
   * Clase CSS adicional para el contenedor.
   */
  className?: string;
}

interface UniversityLoaderFullProps extends LoaderProps {
  /**
   * Controla la visibilidad del loader full-screen.
   */
  isLoading: boolean;
}

interface UniversityLoaderLogoProps extends LoaderProps {
    /**
     * Tamaño del logo y el loader en píxeles.
     * @default 64
     */
    size?: number;
}

// --- Main Molecular Orbit Loader Component ---

/**
 * El núcleo de la animación, un loader SVG inspirado en un modelo atómico/molecular.
 * Utiliza CSS para las animaciones para un rendimiento óptimo.
 */
const MolecularOrbitLoader = forwardRef<HTMLDivElement, LoaderProps>(
  ({ text, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-4", className)}
        {...props}
      >
        <div className="university-loader">
          {/* Bubbles ascending in the background */}
          <div className="bubbles">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bubble" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          
          {/* SVG for atomic/molecular animation */}
          <svg className="loader-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Nucleus */}
            <circle className="nucleus" cx="50" cy="50" r="8" />

            {/* Orbit paths and electrons */}
            <g className="orbit orbit-1">
              <ellipse cx="50" cy="50" rx="40" ry="15" />
              <circle className="electron" cx="90" cy="50" r="4" />
            </g>
            <g className="orbit orbit-2">
              <ellipse cx="50" cy="50" rx="40" ry="15" />
              <circle className="electron" cx="90" cy="50" r="4" />
            </g>
            <g className="orbit orbit-3">
              <ellipse cx="50" cy="50" rx="25" ry="45" />
              <circle className="electron" cx="75" cy="50" r="4" />
            </g>

            {/* Connecting lines for molecular structure */}
            <g className="connections">
              <line x1="50" y1="50" x2="70" y2="30" />
              <line x1="50" y1="50" x2="30" y2="70" />
              <line x1="50" y1="50" x2="80" y2="65" />
            </g>
          </svg>
        </div>
        {text && (
          <p className="text-sm font-medium text-foreground opacity-80 font-poppins" role="status" aria-live="polite">
            {text}
          </p>
        )}
      </div>
    );
  }
);
MolecularOrbitLoader.displayName = "MolecularOrbitLoader";

// --- Exported Loader Components ---

/**
 * UniversityLoaderFull: Un loader que ocupa toda la pantalla con un fondo semitransparente.
 * Ideal para cargas de página iniciales o transiciones importantes.
 * 
 * @example
 * <UniversityLoaderFull isLoading={true} text="Cargando tu portal..." />
 */
export const UniversityLoaderFull = ({ isLoading, text = "Cargando...", className }: UniversityLoaderFullProps) => {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center p-4",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      aria-busy="true"
      aria-live="assertive"
      role="alertdialog"
    >
      <MolecularOrbitLoader text={text} />
    </motion.div>
  );
};
UniversityLoaderFull.displayName = "UniversityLoaderFull";

/**
 * UniversityLoaderInline: Un loader compacto para usar dentro de botones, tarjetas o secciones.
 * 
 * @example
 * <Button disabled>
 *   <UniversityLoaderInline className="mr-2" />
 *   Procesando...
 * </Button>
 */
export const UniversityLoaderInline = forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, ...props }, ref) => {
    return (
        <div ref={ref} className={cn("inline-block w-6 h-6", className)} {...props}>
             <MolecularOrbitLoader />
        </div>
    );
  }
);
UniversityLoaderInline.displayName = "UniversityLoaderInline";


/**
 * UniversityLoaderLogo: Un loader que integra el logo de la universidad con un efecto de pulso.
 * 
 * @example
 * <UniversityLoaderLogo size={80} text="Cargando perfil..." />
 */
export const UniversityLoaderLogo = forwardRef<HTMLDivElement, UniversityLoaderLogoProps>(
  ({ size = 64, text, className, ...props }, ref) => {
    const iconSize = useMemo(() => Math.floor(size * 0.5), [size]);

    return (
        <div ref={ref} className={cn("flex flex-col items-center justify-center gap-4", className)} {...props}>
            <div 
              className="relative flex items-center justify-center"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
                <div className="logo-pulse-bg absolute inset-0 rounded-full" />
                <GraduationCap 
                    className="relative text-primary" 
                    style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                />
            </div>
             {text && (
                <p className="text-sm font-medium text-foreground opacity-80 font-poppins">{text}</p>
            )}
        </div>
    );
  }
);
UniversityLoaderLogo.displayName = "UniversityLoaderLogo";
