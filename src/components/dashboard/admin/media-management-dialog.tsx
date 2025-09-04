
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, Link2 } from "lucide-react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MediaManagementDialogProps {
  documentId: string;
  documentName: string;
  collectionName: "carreras" | "materias" | "siteSettings";
  currentImageUrl?: string;
  onUpdate: () => void;
}

export function MediaManagementDialog({
  documentId,
  documentName,
  collectionName,
  currentImageUrl,
  onUpdate,
}: MediaManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"url" | "file">("url");
  const [url, setUrl] = useState(currentImageUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setUrl(currentImageUrl || "");
    setPreviewUrl(currentImageUrl || "");
  }, [currentImageUrl]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setUrl(result); 
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setPreviewUrl(newUrl);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const initialUrl = currentImageUrl || "";
      setUrl(initialUrl);
      setPreviewUrl(initialUrl);
      setFile(null);
      setUploadType("url");
    }
    setOpen(isOpen);
  };

  const handleUpdate = async () => {
    let imageUrl: string | null = null;
    
    setIsLoading(true);

    if (uploadType === "url") {
        if (!url) {
            toast({ variant: "destructive", title: "URL Inválida", description: "Por favor, introduce una URL válida." });
            setIsLoading(false);
            return;
        }
        imageUrl = url;
    } else {
        if (!file) {
            toast({ variant: "destructive", title: "Archivo no seleccionado", description: "Por favor, selecciona un archivo para subir." });
            setIsLoading(false);
            return;
        }
        imageUrl = url;
    }

    if (!imageUrl) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo obtener la imagen." });
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                collectionName,
                documentId,
                imageUrl,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Error al actualizar la imagen.");
        }
        
        toast({ title: "Éxito", description: "La imagen ha sido actualizada." });
        onUpdate();
        handleOpenChange(false);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">Gestionar Imagen</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Imagen</DialogTitle>
          <DialogDescription>{documentName}</DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden my-4 border">
            {previewUrl && (previewUrl.startsWith("http") || previewUrl.startsWith("data:image")) ? (
                <Image src={previewUrl} alt={documentName} layout="fill" objectFit="cover" />
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                </div>
            )}
        </div>

        <RadioGroup defaultValue="url" value={uploadType} onValueChange={(value: "url" | "file") => setUploadType(value)}>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="r-url" />
                <Label htmlFor="r-url">Usar URL externa</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="file" id="r-file" />
                <Label htmlFor="r-file">Subir archivo</Label>
            </div>
        </RadioGroup>

        {uploadType === "url" ? (
             <div className="space-y-2 py-4">
                <Label htmlFor="url-input" className="flex items-center gap-2"><Link2 className="h-4 w-4"/> URL de la imagen</Label>
                <Input id="url-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={url.startsWith("data:image") ? "" : url} onChange={handleUrlChange} />
            </div>
        ) : (
             <div className="space-y-2 py-4">
                <Label htmlFor="file-input" className="flex items-center gap-2"><Upload className="h-4 w-4"/> Seleccionar archivo</Label>
                <Input id="file-input" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cerrar</Button>
           <Button onClick={handleUpdate} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Guardando..." : "Guardar Cambios"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
