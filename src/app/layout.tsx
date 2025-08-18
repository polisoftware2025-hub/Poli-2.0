import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/layout/sidebar-content";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Poli 2.0",
  description: "An application with AI-powered suggestions and a customizable interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <SidebarContent />
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
