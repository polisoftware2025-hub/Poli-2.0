
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Palette, Settings as SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
       <PageHeader
        title="Configuración"
        description="Gestiona las preferencias de tu cuenta y notificaciones."
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-semibold">Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Notificaciones por Correo</Label>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications">Notificaciones Push</Label>
              <Switch id="pushNotifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="newsNotifications">Anuncios y Noticias</Label>
              <Switch id="newsNotifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-semibold">Apariencia</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Tema</Label>
              <Select defaultValue="light">
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="language">Idioma</Label>
              <Select defaultValue="es">
                <SelectTrigger id="language">
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">Inglés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
