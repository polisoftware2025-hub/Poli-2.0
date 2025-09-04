
"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface MediaManagementDialogProps {
  documentId: string;
  documentName: string;
  collectionName: "carreras" | "materias";
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
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUrlUpdate = async () => {
    if (!url) {
      toast({ variant: "destructive", title: "URL Vacía", description: "Por favor, introduce una URL." });
      return;
    }
    await handleUpdate(url);
  };
  
  const handleFileUpload = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Sin archivo", description: "Por favor, selecciona un archivo para subir." });
      return;
    }
    // Simulate upload and get URL - in a real app this would use Firebase Storage
     const reader = new FileReader();
     reader.readAsDataURL(file);
     reader.onloadend = async () => {
         const base64data = reader.result;
         // This is where you would call your backend to upload to Firebase Storage
         // For now, we'll just simulate it and call the update function directly with the base64 data uri
         // In a real app, this would be a public URL from Storage
         await handleUpdate(base64data as string);
     }
  };
  
  const handleUpdate = async (imageUrl: string) => {
    setIsLoading(true);
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
        
        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden my-4">
            {currentImageUrl ? (
                <Image src={currentImageUrl} alt={documentName} layout="fill" objectFit="cover" />
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                </div>
            )}
        </div>

        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/>Subir Archivo</TabsTrigger>
            <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4"/>Pegar URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="py-4">
            <div className="space-y-4">
                <Label htmlFor="file-upload">Seleccionar imagen</Label>
                <Input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} />
                <Button onClick={handleFileUpload} disabled={isLoading || !file} className="w-full">
                    {isLoading ? "Subiendo..." : "Subir y Guardar"}
                </Button>
            </div>
          </TabsContent>
          <TabsContent value="url" className="py-4">
             <div className="space-y-4">
                <Label htmlFor="url-input">URL de la imagen</Label>
                <Input id="url-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={url} onChange={(e) => setUrl(e.target.value)} />
                <Button onClick={handleUrlUpdate} disabled={isLoading || !url} className="w-full">
                    {isLoading ? "Guardando..." : "Guardar URL"}
                </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
