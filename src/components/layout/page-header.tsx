"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  const { isMobile, state } = useSidebar();
  const showDesktopTrigger = !isMobile && state === 'collapsed';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-medium md:hidden">{title}</h1>
    </header>
  );
}
