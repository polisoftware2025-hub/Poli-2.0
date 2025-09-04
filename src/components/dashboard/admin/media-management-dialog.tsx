
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
  const [imageUrl, setImageUrl] = useState(""); 
  const [urlInput, setUrlInput] = useState(""); 
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      const initialUrl = currentImageUrl || "";
      setPreviewUrl(initialUrl);
      setImageUrl(initialUrl);
      if (initialUrl.startsWith("data:")) {
        setUploadType("file");
        setUrlInput("");
      } else {
        setUploadType("url");
        setUrlInput(initialUrl);
      }
      setFile(null);
    }
  }, [open, currentImageUrl]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setImageUrl(result); 
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    setPreviewUrl(newUrl);
    setImageUrl(newUrl);
  };
  
  const handleUpdate = async () => {
    let finalImageUrl = "";

    if (uploadType === "file" && file) {
        // The data URL is already in imageUrl state from handleFileChange
        finalImageUrl = imageUrl;
    } else if (uploadType === "url") {
        finalImageUrl = urlInput;
    }

    if (!finalImageUrl) {
        toast({ variant: "destructive", title: "Imagen no proporcionada", description: "Por favor, proporciona una URL o sube un archivo." });
        return;
    }
    
    setIsLoading(true);
    
    try {
        const response = await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                collectionName,
                documentId,
                imageUrl: finalImageUrl,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Error al actualizar la imagen.");
        }
        
        toast({ title: "Éxito", description: "La imagen ha sido actualizada." });
        onUpdate();
        setOpen(false);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        
        <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as "url" | "file")}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Usar URL</TabsTrigger>
                <TabsTrigger value="file">Subir Archivo</TabsTrigger>
            </TabsList>
            <TabsContent value="url">
                <div className="space-y-2 py-4">
                    <Label htmlFor="url-input" className="flex items-center gap-2"><Link2 className="h-4 w-4"/> URL de la imagen</Label>
                    <Input id="url-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={urlInput} onChange={handleUrlInputChange} />
                </div>
            </TabsContent>
            <TabsContent value="file">
                <div className="space-y-2 py-4">
                    <Label htmlFor="file-input" className="flex items-center gap-2"><Upload className="h-4 w-4"/> Seleccionar archivo</Label>
                    <Input id="file-input" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
            </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
           <Button onClick={handleUpdate} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Guardando..." : "Guardar Cambios"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
