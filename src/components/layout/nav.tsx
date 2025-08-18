
"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Nav() {
  const pathname = usePathname();
  const [language, setLanguage] = useState("es");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "es";
    setLanguage(savedLanguage);
    setIsClient(true);
  }, []);

  const getNavigationItems = (lang: string) => [
    { href: "/", label: lang === 'en' ? "Dashboard" : "Inicio", icon: LayoutDashboard },
    { href: "/settings", label: lang === 'en' ? "Settings" : "Configuración", icon: Settings },
  ];
  
  if (!isClient) {
    return (
      <SidebarMenu>
        <SidebarMenuSkeleton showIcon />
        <SidebarMenuSkeleton showIcon />
      </SidebarMenu>
    );
  }

  const navigationItems = getNavigationItems(language);

  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={{ children: item.label }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
