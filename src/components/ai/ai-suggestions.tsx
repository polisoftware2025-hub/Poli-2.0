"use client";

import { suggestContent } from "@/ai/flows/suggest-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useState, useTransition } from "react";

type Suggestions = {
  content: string[];
  links: string[];
};

export function AiSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [activity, setActivity] = useState("Just logged in");
  const [isPending, startTransition] = useTransition();

  const activities = [
    { label: "Viewed Projects", value: "Looking at project management board" },
    { label: "Checked Tasks", value: "Reviewing personal to-do list and tasks" },
    { label: "Updated Settings", value: "Changed profile and notification settings" },
  ];

  const handleSuggestion = (newActivity: string) => {
    setActivity(newActivity);
    startTransition(async () => {
      const result = await suggestContent({
        userActivity: newActivity,
        contentTypes: "Documentation, Blog Posts, Community Q&A",
        navigationLinks: "/,/projects,/tasks,/settings",
      });
      setSuggestions({
        content: result.suggestedContent.split(",").map((s) => s.trim()),
        links: result.suggestedLinks.split(",").map((s) => s.trim()),
      });
    });
  };

  React.useEffect(() => {
    handleSuggestion("Just logged in");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarGroup>
      <Card className="border-0 shadow-none group-data-[collapsible=icon]:bg-transparent">
        <CardHeader className="p-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <CardTitle className="hidden items-center gap-2 text-base group-data-[collapsible=icon]:flex">
            <Sparkles className="size-4 text-primary" />
          </CardTitle>
          <div className="group-data-[collapsible=icon]:hidden">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              For You
            </CardTitle>
            <CardDescription className="text-xs">
              Suggestions based on your activity:{" "}
              <span className="font-semibold text-primary">{activity}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 group-data-[collapsible=icon]:hidden">
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Simulate Activity:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activities.map((act) => (
                <Button
                  key={act.value}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal text-xs"
                  onClick={() => handleSuggestion(act.value)}
                  disabled={isPending}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {isPending && (
              <>
                <div>
                  <Skeleton className="h-4 w-24" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-20" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </div>
              </>
            )}
            {!isPending && suggestions && (
              <>
                <div>
                  <h4 className="text-sm font-semibold">Suggested Content</h4>
                  <ul className="mt-1 list-none space-y-1 text-sm text-muted-foreground">
                    {suggestions.content.map((item, i) => item && <li key={i}>- {item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Suggested Links</h4>
                  <ul className="mt-1 list-none space-y-1">
                    {suggestions.links.map((link, i) => (
                      link && <li key={i}>
                        <Link href={link} className="flex items-center gap-1 text-sm text-primary hover:underline">
                          Go to {link === '/' ? 'Dashboard' : link.replace('/', '')} <ArrowRight className="size-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </SidebarGroup>
  );
}

    