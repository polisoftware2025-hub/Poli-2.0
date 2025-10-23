
"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const cardStyle = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-card-style') : 'glass';
    const showShadows = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-show-shadows') === 'true' : true;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius)] border",
          {
            'bg-card/60 backdrop-blur-[var(--blur-intensity)]': cardStyle === 'glass',
            'bg-card': cardStyle === 'flat',
            'bg-card border-border': cardStyle === 'bordered',
            'shadow-lg': showShadows,
            'dark:bg-card/80 dark:backdrop-blur-[var(--blur-intensity)]': cardStyle === 'glass'
          },
          className
        )}
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
    className={cn("flex flex-col space-y-1.5 p-[var(--card-padding,1.5rem)]", className)}
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
  <div ref={ref} className={cn("p-[var(--card-padding,1.5rem)] pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-[var(--card-padding,1.5rem)] pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
