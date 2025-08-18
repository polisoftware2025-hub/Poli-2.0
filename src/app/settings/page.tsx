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
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import React, { useState, useEffect } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("Alex Doe");
  const [email, setEmail] = useState("alex@example.com");

  // State for applied settings
  const [language, setLanguage] = useState("es");
  
  // Temporary state for selections
  const [selectedTheme, setSelectedTheme] = useState("system");
  const [selectedLanguage, setSelectedLanguage] = useState("es");

  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    const savedLanguage = localStorage.getItem("language") || "es";
    
    // Set both applied and selected states on load
    setLanguage(savedLanguage);
    setSelectedLanguage(savedLanguage);
    setSelectedTheme(savedTheme);

    document.documentElement.lang = savedLanguage;

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
    const currentLanguage = localStorage.getItem("language") || "es";
    
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("language", selectedLanguage);

    setLanguage(selectedLanguage);
    document.documentElement.lang = selectedLanguage;

    if (
      selectedTheme === "dark" ||
      (selectedTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast({
      title: selectedLanguage === "es" ? "Preferencias guardadas" : "Preferences saved",
      description: selectedLanguage === "es" ? "Tu tema e idioma han sido actualizados." : "Your theme and language have been updated.",
    });

    if (selectedLanguage !== currentLanguage) {
       console.log("Language changed, reloading page...");
       window.location.reload();
    }
  };
  
  const handleSaveChanges = () => {
    toast({
      title: language === 'es' ? "Cambios guardados" : "Changes saved",
      description: language === 'es' ? "Tu perfil ha sido actualizado." : "Your profile has been updated.",
    });
  };
  
  const t = (text: string) => {
    if (language === 'en') {
      const translations: {[key: string]: string} = {
        "Configuración": "Settings",
        "Perfil": "Profile",
        "Actualiza tu información personal.": "Update your personal information.",
        "Nombre": "Name",
        "Correo Electrónico": "Email",
        "Guardar Cambios": "Save Changes",
        "Preferencias": "Preferences",
        "Personaliza tu experiencia en la aplicación.": "Customize your application experience.",
        "Tema": "Theme",
        "Seleccionar tema": "Select theme",
        "Claro": "Light",
        "Oscuro": "Dark",
        "Sistema": "System",
        "Idioma": "Language",
        "Español": "Spanish",
        "Inglés": "English",
        "Guardar Preferencias": "Save Preferences",
      };
      return translations[text] || text;
    }
    return text;
  }

  return (
    <SidebarInset>
      <PageHeader title={t("Configuración")} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl">{t("Configuración")}</h1>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Perfil")}</CardTitle>
              <CardDescription>
                {t("Actualiza tu información personal.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Nombre")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("Correo Electrónico")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges}>{t("Guardar Cambios")}</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Preferencias")}</CardTitle>
              <CardDescription>
                {t("Personaliza tu experiencia en la aplicación.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{t("Tema")}</Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder={t("Seleccionar tema")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("Claro")}</SelectItem>
                    <SelectItem value="dark">{t("Oscuro")}</SelectItem>
                    <SelectItem value="system">{t("Sistema")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="language">{t("Idioma")}</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t("Español")}</SelectItem>
                    <SelectItem value="en">{t("Inglés")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
             <CardFooter>
              <Button onClick={handleSavePreferences}>{t("Guardar Preferencias")}</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}
