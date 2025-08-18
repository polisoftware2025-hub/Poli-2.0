"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("Alex Doe");
  const [email, setEmail] = useState("alex@example.com");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("es");
  const [emailNotifications, setEmailNotifications] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    const savedLanguage = localStorage.getItem("language") || "es";
    setTheme(savedTheme);
    setLanguage(savedLanguage);

    if (
      savedTheme === "dark" ||
      (savedTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);

    if (
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast({
      title: "Preferencias guardadas",
      description: "Tu tema e idioma han sido actualizados.",
    });

    // For now, we just show a toast. A real app would reload or re-render content.
    if (language !== (localStorage.getItem("language") || "es")) {
       console.log("Idioma cambiado, refrescando la página...");
       window.location.reload();
    }
  };
  
  const handleSaveChanges = () => {
    toast({
      title: "Cambios guardados",
      description: "Tu perfil ha sido actualizado.",
    });
  };

  return (
    <SidebarInset>
      <PageHeader title="Configuración" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">Configuración</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>
                Personaliza tu experiencia en la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Seleccionar tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">Inglés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Notificaciones por Correo</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Recibe actualizaciones y resúmenes por correo.
                  </span>
                </Label>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </CardContent>
             <CardFooter>
              <Button onClick={handleSavePreferences}>Guardar Preferencias</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}