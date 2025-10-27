

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
import { Settings as SettingsIcon, Palette, Text, Layout, Monitor, Sun, Moon, Save, RefreshCw, Upload, Download, Check, ChevronsUpDown, Laptop } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useUserPreferences, type UserPreferences } from "@/context/UserPreferencesContext";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const colorPresets = [
    { name: "Azul Tecnológico", primary: { hue: 221, saturation: 83, lightness: 53 }, accent: { hue: 262, saturation: 83, lightness: 60 } },
    { name: "Morado Futurista", primary: { hue: 262, saturation: 83, lightness: 60 }, accent: { hue: 221, saturation: 83, lightness: 53 } },
    { name: "Verde Neón", primary: { hue: 142, saturation: 71, lightness: 45 }, accent: { hue: 280, saturation: 85, lightness: 60 } },
    { name: "Naranja Profesional", primary: { hue: 25, saturation: 95, lightness: 53 }, accent: { hue: 220, saturation: 13, lightness: 45 } },
    { name: "Gris Minimalista", primary: { hue: 215, saturation: 28, lightness: 44 }, accent: { hue: 215, saturation: 20, lightness: 65 } },
];

const availableFonts = [
  "Poppins", "Inter", "Roboto", "Montserrat", "Lato", "Nunito", "Open Sans", "Raleway", 
  "Merriweather", "Playfair Display", "Lora",
  "Exo 2", "Orbitron", "Space Grotesk", "Teko", "Bebas Neue",
  "Lobster", "Pacifico", "Caveat", 
  "Source Code Pro", "IBM Plex Mono",
];

const FontSelector = () => {
    const context = useUserPreferences();
    if (!context) return null;
    const { preferences, updatePreference } = context;
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-48 justify-between"
                >
                    <span className="truncate">{preferences.fontFamily}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
                <Command>
                    <CommandInput placeholder="Buscar fuente..." />
                    <CommandList>
                        <CommandEmpty>No se encontró la fuente.</CommandEmpty>
                        <CommandGroup>
                            {availableFonts.map((font) => (
                                <CommandItem
                                    key={font}
                                    value={font}
                                    onSelect={(currentValue) => {
                                        const newFont = currentValue === preferences.fontFamily ? preferences.fontFamily : currentValue;
                                        updatePreference('fontFamily', newFont as UserPreferences['fontFamily']);
                                        setOpen(false);
                                    }}
                                    style={{ fontFamily: font }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            preferences.fontFamily === font ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {font}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export default function SettingsPage() {
  const context = useUserPreferences();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!context) {
    return <div>Cargando preferencias...</div>;
  }
  
  const { preferences, updatePreference, resetPreferences, isLoading, setPreferences } = context;
  
  const handleExport = () => {
      const blob = new Blob([JSON.stringify(preferences, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poli-theme-config_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Configuración Exportada", description: "Tu archivo de configuración ha sido descargado." });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const newPrefs = JSON.parse(e.target?.result as string);
          setPreferences(newPrefs);
          toast({ title: "Configuración Importada", description: "Tu nuevo tema ha sido aplicado." });
        } catch (error) {
          toast({ variant: "destructive", title: "Error de Importación", description: "El archivo de configuración no es válido." });
        }
      };
      reader.readAsText(file);
    }
  };

  if(isLoading){
      return <div>Cargando configuración...</div>
  }

  return (
    <div className="flex flex-col gap-8">
       <PageHeader
        title="Configuración Avanzada"
        description="Personaliza completamente el aspecto y la sensación de tu entorno de trabajo."
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
      />

       <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-3 space-y-8">
            <SettingCard icon={SettingsIcon} title="Preferencias Generales">
                <SettingRow label="Idioma">
                    <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value as UserPreferences['language'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Densidad de la Interfaz">
                     <Select value={preferences.density} onValueChange={(value) => updatePreference('density', value as UserPreferences['density'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compact">Compacta</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                             <SelectItem value="spacious">Amplia</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Activar Animaciones Globales">
                    <Switch checked={preferences.animationsEnabled} onCheckedChange={(checked) => updatePreference('animationsEnabled', checked)} />
                </SettingRow>
            </SettingCard>

            <SettingCard icon={Palette} title="Personalización de Tema">
                <SettingRow label="Modo">
                    <div className="flex items-center gap-2 p-1 rounded-full bg-muted">
                        <Button variant={preferences.themeMode === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => updatePreference('themeMode', 'light')} className="rounded-full"><Sun className="mr-2 h-4 w-4"/>Claro</Button>
                        <Button variant={preferences.themeMode === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => updatePreference('themeMode', 'dark')} className="rounded-full"><Moon className="mr-2 h-4 w-4"/>Oscuro</Button>
                        <Button variant={preferences.themeMode === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => updatePreference('themeMode', 'system')} className="rounded-full"><Laptop className="mr-2 h-4 w-4"/>Sistema</Button>
                    </div>
                </SettingRow>
                <div className="space-y-3">
                    <Label className="font-medium">Paleta de Colores Base</Label>
                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map(preset => (
                            <Button key={preset.name} variant="outline" size="sm" onClick={() => { updatePreference('primaryColor', preset.primary); updatePreference('accentColor', preset.accent); }}>
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                     <ColorPicker settingKey="primaryColor" label="Color Primario" preferences={preferences} updatePreference={updatePreference} />
                     <ColorPicker settingKey="accentColor" label="Color de Acento" preferences={preferences} updatePreference={updatePreference} />
                 </div>
            </SettingCard>
            
            <SettingCard icon={Monitor} title="Apariencia Visual">
                 <SettingRow label="Estilo de Tarjetas">
                     <Select value={preferences.cardStyle} onValueChange={(value) => updatePreference('cardStyle', value as UserPreferences['cardStyle'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="glass">Glass UI</SelectItem>
                            <SelectItem value="flat">Plano</SelectItem>
                            <SelectItem value="bordered">Bordeado</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Redondez de Bordes (rem)">
                    <div className="flex items-center gap-4 w-full max-w-sm">
                        <Slider value={[preferences.borderRadius]} onValueChange={([val]) => updatePreference('borderRadius', val)} min={0} max={2} step={0.1} />
                        <span className="font-mono text-sm w-12 text-center">{preferences.borderRadius.toFixed(1)}</span>
                    </div>
                </SettingRow>
                 <SettingRow label="Intensidad de Desenfoque (px)">
                    <div className="flex items-center gap-4 w-full max-w-sm">
                        <Slider value={[preferences.blurIntensity]} onValueChange={([val]) => updatePreference('blurIntensity', val)} min={0} max={40} step={1} />
                         <span className="font-mono text-sm w-12 text-center">{preferences.blurIntensity}</span>
                    </div>
                </SettingRow>
                <SettingRow label="Activar Sombras Flotantes">
                    <Switch checked={preferences.showShadows} onCheckedChange={(checked) => updatePreference('showShadows', checked)} />
                </SettingRow>
            </SettingCard>

            <SettingCard icon={Text} title="Fuentes y Tipografía">
                <SettingRow label="Familia Tipográfica">
                    <FontSelector />
                </SettingRow>
                <SettingRow label="Tamaño de Fuente Global">
                    <Select value={preferences.fontSize} onValueChange={(value) => updatePreference('fontSize', value as UserPreferences['fontSize'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="14px">Pequeño</SelectItem>
                            <SelectItem value="16px">Normal</SelectItem>
                            <SelectItem value="18px">Grande</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                 <SettingRow label="Peso de Fuente Global">
                    <Select value={preferences.fontWeight} onValueChange={(value) => updatePreference('fontWeight', value as UserPreferences['fontWeight'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="400">Normal</SelectItem>
                            <SelectItem value="500">Medio</SelectItem>
                            <SelectItem value="600">Semi-Negrita</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Espaciado de Letras">
                    <Select value={preferences.letterSpacing} onValueChange={(value) => updatePreference('letterSpacing', value as UserPreferences['letterSpacing'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="-0.05em">Compacto</SelectItem>
                            <SelectItem value="0.05em">Amplio</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
            </SettingCard>

             <SettingCard icon={Layout} title="Diseño de Interfaz">
                <SettingRow label="Posición del Menú Lateral">
                    <Select value={preferences.sidebarPosition} onValueChange={(value) => updatePreference('sidebarPosition', value as UserPreferences['sidebarPosition'])}>
                        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Izquierda</SelectItem>
                            <SelectItem value="right">Derecha</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
            </SettingCard>
            
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Configuración</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                    <Button onClick={handleImport} variant="outline"><Upload className="mr-2 h-4 w-4"/>Importar</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    <Button onClick={resetPreferences} variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Restablecer</Button>
                </CardContent>
            </Card>

        </div>

        <div className="md:col-span-2 md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Vista Previa Dinámica</CardTitle>
                </CardHeader>
                <CardContent>
                    <ThemePreview preferences={preferences} />
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}

const SettingCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary" />
                <CardTitle>{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2 md:pl-6">
            {children}
        </CardContent>
    </Card>
);

const SettingRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <Label className="font-medium shrink-0">{label}</Label>
        <div className="w-full md:w-auto flex justify-start md:justify-end">
            {children}
        </div>
    </div>
);

const ColorPicker = ({ label, settingKey, preferences, updatePreference }: { label: string; settingKey: 'primaryColor' | 'accentColor'; preferences: UserPreferences, updatePreference: Function }) => {
    const color = preferences[settingKey];

    const handleHueChange = (newHue: number) => {
        updatePreference(settingKey, { ...color, hue: newHue });
    };

    const handleSaturationChange = (newSaturation: number) => {
        updatePreference(settingKey, { ...color, saturation: newSaturation });
    };

    const handleLightnessChange = (newLightness: number) => {
        updatePreference(settingKey, { ...color, lightness: newLightness });
    };

    const colorString = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: colorString }}></div>
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Tono (Hue)</Label>
                <Slider value={[color.hue]} onValueChange={([val]) => handleHueChange(val)} min={0} max={360} step={1} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Saturación</Label>
                <Slider value={[color.saturation]} onValueChange={([val]) => handleSaturationChange(val)} min={0} max={100} step={1} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Luminosidad</Label>
                <Slider value={[color.lightness]} onValueChange={([val]) => handleLightnessChange(val)} min={0} max={100} step={1} />
            </div>
        </div>
    );
};

const ThemePreview = ({ preferences }: { preferences: UserPreferences }) => {
  const { themeMode, primaryColor, accentColor, fontFamily, fontSize, fontWeight, letterSpacing, borderRadius, cardStyle, blurIntensity, showShadows, sidebarPosition } = preferences;

  const [isSystemDark, setIsSystemDark] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = themeMode === 'system' ? (isSystemDark ? 'dark' : 'light') : themeMode;

  const primary = `hsl(${primaryColor.hue}, ${primaryColor.saturation}%, ${primaryColor.lightness}%)`;
  const accent = `hsl(${accentColor.hue}, ${accentColor.saturation}%, ${accentColor.lightness}%)`;
  
  const background = effectiveTheme === 'dark' 
    ? `hsl(220, 20%, 7%)`
    : `hsl(220, 20%, 97%)`;
  const card = effectiveTheme === 'dark' 
    ? (cardStyle === 'glass' ? 'hsla(224, 71%, 4%, 0.6)' : 'hsl(224, 71%, 4%)')
    : (cardStyle === 'glass' ? 'hsla(0, 0%, 100%, 0.8)' : 'hsl(0, 0%, 100%)');
  const cardBorder = effectiveTheme === 'dark' ? 'hsl(217, 33%, 25%)' : 'hsl(214, 32%, 91%)';
  const textForeground = effectiveTheme === 'dark' ? 'hsl(210, 40%, 98%)' : 'hsl(220, 90%, 4%)';
  const textMuted = effectiveTheme === 'dark' ? 'hsl(215, 20%, 65%)' : 'hsl(215, 28%, 44%)';
  
  const cardDynamicStyle: React.CSSProperties = {
      backgroundColor: card,
      borderRadius: `${borderRadius}rem`,
      boxShadow: showShadows ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none',
      borderColor: cardBorder,
      borderWidth: cardStyle === 'bordered' ? '1px' : '0',
      backdropFilter: cardStyle === 'glass' ? `blur(${blurIntensity}px)` : 'none',
      WebkitBackdropFilter: cardStyle === 'glass' ? `blur(${blurIntensity}px)` : 'none',
  };
  
  const sidebarContainerClass = sidebarPosition === 'left' ? 'flex-row' : 'flex-row-reverse';

  return (
    <div 
      className="w-full h-[450px] rounded-lg p-4 border overflow-hidden transition-all"
      style={{ 
        background: background,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
        letterSpacing: letterSpacing,
        color: textForeground
      }}
    >
      <div className={`flex h-full ${sidebarContainerClass}`}>
        <div 
            className="w-16 h-full flex flex-col items-center py-4 space-y-4"
            style={cardDynamicStyle}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{backgroundColor: primary, color: 'white'}}>P</div>
          <div className="space-y-2">
            <div className="w-6 h-6 rounded" style={{backgroundColor: accent}}></div>
            <div className="w-6 h-6 rounded" style={{backgroundColor: textMuted, opacity: 0.3}}></div>
            <div className="w-6 h-6 rounded" style={{backgroundColor: textMuted, opacity: 0.3}}></div>
          </div>
        </div>
        <div className={`flex-1 h-full flex flex-col p-4 space-y-4 ${sidebarPosition === 'left' ? 'rounded-r-md' : 'rounded-l-md'}`} style={{background: 'transparent'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{color: textForeground}}>Panel</h3>
            <div className="w-6 h-6 rounded-full" style={{backgroundColor: textMuted, opacity: 0.3}}></div>
          </div>
          <div 
            className="p-4"
            style={cardDynamicStyle}
          >
            <p className="text-sm font-medium" style={{color: textForeground}}>Hola, Usuario</p>
            <p className="text-xs" style={{color: textMuted}}>Este es un ejemplo de tarjeta.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm rounded-md" style={{backgroundColor: primary, color: 'white'}}>Primario</button>
            <button className="px-3 py-1 text-sm rounded-md" style={{backgroundColor: accent, color: 'white'}}>Acento</button>
          </div>
        </div>
      </div>
    </div>
  );
};
