
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
import { Image as ImageIcon } from "lucide-react";
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
  const [url, setUrl] = useState(currentImageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!url) {
      toast({ variant: "destructive", title: "URL Vacía", description: "Por favor, introduce una URL." });
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
                imageUrl: url,
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
            {url ? (
                <Image src={url} alt={documentName} layout="fill" objectFit="cover" />
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                </div>
            )}
        </div>

        <div className="space-y-4 py-4">
            <Label htmlFor="url-input">URL de la imagen</Label>
            <Input id="url-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
           <Button onClick={handleUpdate} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Guardando..." : "Guardar URL"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
