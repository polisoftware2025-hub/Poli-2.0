
"use client";

import * as React from "react"

import { cn } from "@/lib/utils"
import { useUserPreferences } from "@/context/UserPreferencesContext";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    // Attempt to get context. It might be null on public pages.
    const context = useUserPreferences();
    const preferences = context?.preferences;

    // Apply dynamic styles ONLY if the context and preferences are available.
    const cardStyle: React.CSSProperties = preferences ? {
        '--card-border-radius': `${preferences.borderRadius}rem`,
        '--card-blur': preferences.cardStyle === 'glass' ? `${preferences.blurIntensity}px` : '0px',
        backgroundColor: preferences.cardStyle === 'glass' ? 'hsla(var(--card) / 0.6)' : 'hsl(var(--card))',
        backdropFilter: preferences.cardStyle === 'glass' ? `blur(var(--card-blur))` : 'none',
        WebkitBackdropFilter: preferences.cardStyle === 'glass' ? `blur(var(--card-blur))` : 'none',
        boxShadow: preferences.showShadows ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none',
        borderWidth: preferences.cardStyle === 'bordered' ? '1px' : '0',
    } : {};

    // Base classes are always applied. Dynamic radius is applied if context exists.
    const finalClassName = context ? 
        cn("rounded-[var(--card-border-radius)] border bg-card text-card-foreground", className) :
        cn("rounded-lg border bg-card text-card-foreground shadow-sm", className);

    const finalStyle = context ? cardStyle : {};

    return (
      <div
        ref={ref}
        style={finalStyle}
        className={finalClassName}
        {...props}
      />
    )
})
Card.displayName = "Card"


const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
