"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  return (
    <SidebarGroup>
      <Card className="border-0 shadow-none group-data-[collapsible=icon]:bg-transparent">
        <CardHeader className="p-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <CardTitle className="hidden items-center gap-2 text-base group-data-[collapsible=icon]:flex">
            <Languages className="size-4 text-primary" />
          </CardTitle>
          <div className="group-data-[collapsible=icon]:hidden">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="size-4 text-primary" />
              Configuración
            </CardTitle>
            <CardDescription className="text-xs">
              Ajustes de idioma y región.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 group-data-[collapsible=icon]:hidden">
          <div className="mt-2 space-y-2">
            <Select defaultValue="es">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </SidebarGroup>
  )
}
