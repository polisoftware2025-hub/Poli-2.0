
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

const colorPresets = [
    { name: "Azul Tecnológico", primary: { hue: 221, saturation: 83, lightness: 53 }, accent: { hue: 262, saturation: 83, lightness: 60 } },
    { name: "Morado Futurista", primary: { hue: 262, saturation: 83, lightness: 60 }, accent: { hue: 221, saturation: 83, lightness: 53 } },
    { name: "Verde Neón", primary: { hue: 142, saturation: 71, lightness: 45 }, accent: { hue: 280, saturation: 85, lightness: 60 } },
    { name: "Naranja Profesional", primary: { hue: 25, saturation: 95, lightness: 53 }, accent: { hue: 220, saturation: 13, lightness: 45 } },
    { name: "Gris Minimalista", primary: { hue: 215, saturation: 28, lightness: 44 }, accent: { hue: 215, saturation: 20, lightness: 65 } },
];

export default function SettingsPage() {
  const { preferences, updatePreference, resetPreferences, setPreferences } = useUserPreferences();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          toast({ title: "Configuración Importada", description: "Tu nuevo tema se ha aplicado correctamente." });
        } catch (error) {
          toast({ variant: "destructive", title: "Error de Importación", description: "El archivo de configuración no es válido." });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col gap-8">
       <PageHeader
        title="Configuración Avanzada"
        description="Personaliza completamente el aspecto y la sensación de tu entorno de trabajo."
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
      />

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            {/* General Preferences */}
            <SettingCard icon={SettingsIcon} title="Preferencias Generales">
                <SettingRow label="Idioma">
                    <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
                    </Select>
                </SettingRow>
                <SettingRow label="Densidad de la Interfaz">
                     <Select value={preferences.density} onValueChange={(value) => updatePreference('density', value)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
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

            {/* Theme Customization */}
            <SettingCard icon={Palette} title="Personalización de Tema">
                <SettingRow label="Modo">
                    <div className="flex items-center gap-2 p-1 rounded-full bg-muted">
                        <Button variant={preferences.themeMode === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => updatePreference('themeMode', 'light')} className="rounded-full"><Sun className="mr-2 h-4 w-4"/>Claro</Button>
                        <Button variant={preferences.themeMode === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => updatePreference('themeMode', 'dark')} className="rounded-full"><Moon className="mr-2 h-4 w-4"/>Oscuro</Button>
                    </div>
                </SettingRow>
                <SettingRow label="Paleta de Colores Base">
                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map(preset => (
                            <Button key={preset.name} variant="outline" size="sm" onClick={() => { updatePreference('primaryColor', preset.primary); updatePreference('accentColor', preset.accent); }}>
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </SettingRow>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                     <ColorPicker settingKey="primaryColor" label="Color Primario" />
                     <ColorPicker settingKey="accentColor" label="Color de Acento" />
                 </div>
            </SettingCard>
            
            {/* Visual Appearance */}
            <SettingCard icon={Monitor} title="Apariencia Visual">
                 <SettingRow label="Estilo de Tarjetas">
                     <Select value={preferences.cardStyle} onValueChange={(value) => updatePreference('cardStyle', value)}>
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

            {/* Typography */}
            <SettingCard icon={Text} title="Fuentes y Tipografía">
                <SettingRow label="Familia Tipográfica">
                    <Select value={preferences.fontFamily} onValueChange={(value) => updatePreference('fontFamily', value)}>
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
                    <Select value={preferences.fontSize} onValueChange={(value) => updatePreference('fontSize', value)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="14px">Pequeño</SelectItem>
                            <SelectItem value="16px">Normal</SelectItem>
                            <SelectItem value="18px">Grande</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingRow>
            </SettingCard>

             <SettingCard icon={Layout} title="Diseño de Interfaz">
                <SettingRow label="Posición del Menú Lateral">
                    <Select value={preferences.sidebarPosition} onValueChange={(value) => updatePreference('sidebarPosition', value)}>
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
                    <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                    <Button onClick={handleImport} variant="outline"><Upload className="mr-2 h-4 w-4"/>Importar</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    <Button onClick={resetPreferences} variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Restablecer</Button>
                </CardContent>
            </Card>

        </div>

        {/* Dynamic Preview */}
        <div className="lg:col-span-1 sticky top-24">
            <Card>
                <CardHeader>
                    <CardTitle>Vista Previa Dinámica</CardTitle>
                </CardHeader>
                <CardContent>
                    <ThemePreview />
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

const ColorPicker = ({ label, settingKey }: { label: string; settingKey: 'primaryColor' | 'accentColor' }) => {
    const { preferences, updatePreference } = useUserPreferences();
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

const ThemePreview = () => (
    <div className="w-full h-[450px] rounded-lg bg-background p-4 border overflow-hidden scale-100 origin-top">
      <div className="flex h-full">
        {/* Mini Sidebar */}
        <div className="w-16 h-full rounded-l-md bg-card flex flex-col items-center py-4 space-y-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">P</div>
          <div className="space-y-2">
            <div className="w-6 h-6 rounded bg-accent"></div>
            <div className="w-6 h-6 rounded bg-muted"></div>
            <div className="w-6 h-6 rounded bg-muted"></div>
          </div>
        </div>
        {/* Mini Content */}
        <div className="flex-1 h-full rounded-r-md bg-background flex flex-col p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Panel</h3>
            <div className="w-6 h-6 rounded-full bg-muted"></div>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm font-medium text-foreground">Hola, Usuario</p>
            <p className="text-xs text-muted-foreground">Este es un ejemplo de tarjeta.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm">Botón Primario</Button>
            <Button size="sm" variant="secondary">Secundario</Button>
          </div>
        </div>
      </div>
    </div>
  );
