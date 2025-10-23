
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
import { Settings as SettingsIcon, Palette, Text, Layout, Monitor, Sun, Moon, Save, RefreshCw, Upload, Download, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useUserPreferences, type UserPreferences } from "@/context/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";

const colorPresets = [
    { name: "Azul Tecnológico", primary: { hue: 221, saturation: 83, lightness: 53 }, accent: { hue: 262, saturation: 83, lightness: 60 } },
    { name: "Morado Futurista", primary: { hue: 262, saturation: 83, lightness: 60 }, accent: { hue: 221, saturation: 83, lightness: 53 } },
    { name: "Verde Neón", primary: { hue: 142, saturation: 71, lightness: 45 }, accent: { hue: 280, saturation: 85, lightness: 60 } },
    { name: "Naranja Profesional", primary: { hue: 25, saturation: 95, lightness: 53 }, accent: { hue: 220, saturation: 13, lightness: 45 } },
    { name: "Gris Minimalista", primary: { hue: 215, saturation: 28, lightness: 44 }, accent: { hue: 215, saturation: 20, lightness: 65 } },
];

export default function SettingsPage() {
  const { preferences: globalPreferences, setPreferences: setGlobalPreferences, resetPreferences: resetGlobalPreferences, isLoading: isLoadingGlobal } = useUserPreferences();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Draft State for local changes ---
  const [draftPreferences, setDraftPreferences] = useState<UserPreferences>(globalPreferences);
  
  // Sync local draft state when global preferences are loaded initially
  useEffect(() => {
    if(!isLoadingGlobal){
        setDraftPreferences(globalPreferences);
    }
  }, [isLoadingGlobal, globalPreferences]);

  const updateDraftPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setDraftPreferences(prev => ({...prev, [key]: value}));
  };
  
  const handleSaveChanges = () => {
    setGlobalPreferences(draftPreferences);
    toast({ title: "Configuración Guardada", description: "Tu nuevo tema se ha aplicado en toda la aplicación." });
  };
  
  const handleReset = () => {
    resetGlobalPreferences();
    // Also reset the draft to reflect the changes immediately
    setDraftPreferences(globalPreferences);
    toast({ title: "Configuración Restablecida", description: "Se han restaurado los valores predeterminados." });
  };
  
  const handleExport = () => {
      const blob = new Blob([JSON.stringify(draftPreferences, null, 2)], { type: "application/json" });
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
          setDraftPreferences(newPrefs); // Update draft state first
          toast({ title: "Configuración Lista para Importar", description: "Revisa los cambios y haz clic en 'Guardar mi Estilo' para aplicar." });
        } catch (error) {
          toast({ variant: "destructive", title: "Error de Importación", description: "El archivo de configuración no es válido." });
        }
      };
      reader.readAsText(file);
    }
  };

  if(isLoadingGlobal){
      return <div>Cargando configuración...</div>
  }

  return (
    <div className="flex flex-col gap-8">
       <PageHeader
        title="Configuración Avanzada"
        description="Personaliza completamente el aspecto y la sensación de tu entorno de trabajo."
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
      />

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <SettingCard icon={SettingsIcon} title="Preferencias Generales">
                <SettingRow label="Idioma">
                    <Select value={draftPreferences.language} onValueChange={(value) => updateDraftPreference('language', value as UserPreferences['language'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Densidad de la Interfaz">
                     <Select value={draftPreferences.density} onValueChange={(value) => updateDraftPreference('density', value as UserPreferences['density'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compact">Compacta</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                             <SelectItem value="spacious">Amplia</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Activar Animaciones Globales">
                    <Switch checked={draftPreferences.animationsEnabled} onCheckedChange={(checked) => updateDraftPreference('animationsEnabled', checked)} />
                </SettingRow>
            </SettingCard>

            <SettingCard icon={Palette} title="Personalización de Tema">
                <SettingRow label="Modo">
                    <div className="flex items-center gap-2 p-1 rounded-full bg-muted">
                        <Button variant={draftPreferences.themeMode === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => updateDraftPreference('themeMode', 'light')} className="rounded-full"><Sun className="mr-2 h-4 w-4"/>Claro</Button>
                        <Button variant={draftPreferences.themeMode === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => updateDraftPreference('themeMode', 'dark')} className="rounded-full"><Moon className="mr-2 h-4 w-4"/>Oscuro</Button>
                    </div>
                </SettingRow>
                <SettingRow label="Paleta de Colores Base">
                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map(preset => (
                            <Button key={preset.name} variant="outline" size="sm" onClick={() => { updateDraftPreference('primaryColor', preset.primary); updateDraftPreference('accentColor', preset.accent); }}>
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </SettingRow>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                     <ColorPicker settingKey="primaryColor" label="Color Primario" draftPreferences={draftPreferences} updateDraftPreference={updateDraftPreference} />
                     <ColorPicker settingKey="accentColor" label="Color de Acento" draftPreferences={draftPreferences} updateDraftPreference={updateDraftPreference} />
                 </div>
            </SettingCard>
            
            <SettingCard icon={Monitor} title="Apariencia Visual">
                 <SettingRow label="Estilo de Tarjetas">
                     <Select value={draftPreferences.cardStyle} onValueChange={(value) => updateDraftPreference('cardStyle', value as UserPreferences['cardStyle'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="glass">Glass UI</SelectItem>
                            <SelectItem value="flat">Plano</SelectItem>
                            <SelectItem value="bordered">Bordeado</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Redondez de Bordes (rem)">
                    <div className="flex items-center gap-4 w-full max-w-sm">
                        <Slider value={[draftPreferences.borderRadius]} onValueChange={([val]) => updateDraftPreference('borderRadius', val)} min={0} max={2} step={0.1} />
                        <span className="font-mono text-sm w-12 text-center">{draftPreferences.borderRadius.toFixed(1)}</span>
                    </div>
                </SettingRow>
                 <SettingRow label="Intensidad de Desenfoque (px)">
                    <div className="flex items-center gap-4 w-full max-w-sm">
                        <Slider value={[draftPreferences.blurIntensity]} onValueChange={([val]) => updateDraftPreference('blurIntensity', val)} min={0} max={40} step={1} />
                         <span className="font-mono text-sm w-12 text-center">{draftPreferences.blurIntensity}</span>
                    </div>
                </SettingRow>
                <SettingRow label="Activar Sombras Flotantes">
                    <Switch checked={draftPreferences.showShadows} onCheckedChange={(checked) => updateDraftPreference('showShadows', checked)} />
                </SettingRow>
            </SettingCard>

            <SettingCard icon={Text} title="Fuentes y Tipografía">
                <SettingRow label="Familia Tipográfica">
                    <Select value={draftPreferences.fontFamily} onValueChange={(value) => updateDraftPreference('fontFamily', value as UserPreferences['fontFamily'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Tamaño de Fuente Global">
                    <Select value={draftPreferences.fontSize} onValueChange={(value) => updateDraftPreference('fontSize', value as UserPreferences['fontSize'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="14px">Pequeño</SelectItem>
                            <SelectItem value="16px">Normal</SelectItem>
                            <SelectItem value="18px">Grande</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                 <SettingRow label="Peso de Fuente Global">
                    <Select value={draftPreferences.fontWeight} onValueChange={(value) => updateDraftPreference('fontWeight', value as UserPreferences['fontWeight'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="400">Normal</SelectItem>
                            <SelectItem value="500">Medio</SelectItem>
                            <SelectItem value="600">Semi-Negrita</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Espaciado de Letras">
                    <Select value={draftPreferences.letterSpacing} onValueChange={(value) => updateDraftPreference('letterSpacing', value as UserPreferences['letterSpacing'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
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
                    <Select value={draftPreferences.sidebarPosition} onValueChange={(value) => updateDraftPreference('sidebarPosition', value as UserPreferences['sidebarPosition'])}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
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
                    <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Guardar mi Estilo</Button>
                    <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                    <Button onClick={handleImport} variant="outline"><Upload className="mr-2 h-4 w-4"/>Importar</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    <Button onClick={handleReset} variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Restablecer</Button>
                </CardContent>
            </Card>

        </div>

        <div className="lg:col-span-1 sticky top-24">
            <Card>
                <CardHeader>
                    <CardTitle>Vista Previa Dinámica</CardTitle>
                </CardHeader>
                <CardContent>
                    <ThemePreview preferences={draftPreferences} />
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
        <CardContent className="space-y-6 pt-2 pl-6">
            {children}
        </CardContent>
    </Card>
);

const SettingRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <Label className="font-medium shrink-0">{label}</Label>
        <div className="w-full sm:w-auto flex justify-end">
            {children}
        </div>
    </div>
);

const ColorPicker = ({ label, settingKey, draftPreferences, updateDraftPreference }: { label: string; settingKey: 'primaryColor' | 'accentColor'; draftPreferences: UserPreferences, updateDraftPreference: Function }) => {
    const color = draftPreferences[settingKey];

    const handleHueChange = (newHue: number) => {
        updateDraftPreference(settingKey, { ...color, hue: newHue });
    };

    const handleSaturationChange = (newSaturation: number) => {
        updateDraftPreference(settingKey, { ...color, saturation: newSaturation });
    };

    const handleLightnessChange = (newLightness: number) => {
        updateDraftPreference(settingKey, { ...color, lightness: newLightness });
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

  const primary = `hsl(${primaryColor.hue}, ${primaryColor.saturation}%, ${primaryColor.lightness}%)`;
  const accent = `hsl(${accentColor.hue}, ${accentColor.saturation}%, ${accentColor.lightness}%)`;
  
  const background = themeMode === 'dark' 
    ? `hsl(220, 90%, 4%)`
    : `hsl(220, 20%, 97%)`;
  const card = themeMode === 'dark' 
    ? 'hsla(224, 71%, 4%, 0.6)' 
    : 'hsla(0, 0%, 100%, 0.9)';
  const cardBorder = themeMode === 'dark' ? 'hsl(217 33% 25%)' : 'hsl(214 32% 91%)';
  const textForeground = themeMode === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(220 90% 4%)';
  const textMuted = themeMode === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 28% 44%)';
  
  const cardClasses = {
      glass: "bg-opacity-60 backdrop-blur-md",
      flat: "bg-opacity-100",
      bordered: "bg-opacity-90 border",
  };

  const cardDynamicStyle: React.CSSProperties = {
      backgroundColor: card,
      borderRadius: `${borderRadius}rem`,
      boxShadow: showShadows ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none',
      borderColor: cardBorder,
      backdropFilter: cardStyle === 'glass' ? `blur(${blurIntensity}px)` : 'none',
      WebkitBackdropFilter: cardStyle === 'glass' ? `blur(${blurIntensity}px)` : 'none',
  };
  
  const sidebarContainerClass = sidebarPosition === 'left' ? 'flex-row' : 'flex-row-reverse';

  return (
    <div 
      className="w-full h-[450px] rounded-lg p-4 border overflow-hidden scale-100 origin-top transition-all"
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
            style={{
                ...cardDynamicStyle,
                borderWidth: cardStyle === 'bordered' ? '1px' : '0'
            }}
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
            style={{
                ...cardDynamicStyle,
                borderWidth: cardStyle === 'bordered' ? '1px' : '0'
            }}
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
