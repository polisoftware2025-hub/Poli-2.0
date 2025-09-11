
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { MediaManagementDialog } from "@/components/dashboard/admin/media-management-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Materia } from "@/types";
import { ImageIcon, Clapperboard } from "lucide-react";
import { createHash } from 'crypto';


// Simple hash function to get a numeric seed from a string
const getSeedFromString = (str: string): string => {
    return createHash('md5').update(str).digest('hex');
};


export default function MediaManagementPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [subjects, setSubjects] = useState<Materia[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchMediaData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Careers and Subjects
      const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      
      const careersList: Career[] = [];
      const allSubjectsMap = new Map<string, Materia>();
      
      careersSnapshot.forEach(careerDoc => {
        const careerData = careerDoc.data();
        careersList.push({
          id: careerDoc.id,
          nombre: careerData.nombre,
          imagenURL: careerData.imagenURL || "",
        });

        if (careerData.ciclos && Array.isArray(careerData.ciclos)) {
          careerData.ciclos.forEach((ciclo: any) => {
            if (ciclo.materias && Array.isArray(ciclo.materias)) {
              ciclo.materias.forEach((materia: any) => {
                if(materia.id && !allSubjectsMap.has(materia.id)) {
                  allSubjectsMap.set(materia.id, { 
                      id: materia.id, 
                      nombre: materia.nombre,
                      codigo: materia.codigo,
                      creditos: materia.creditos,
                      imagenURL: materia.imagenURL || ""
                  });
                }
              });
            }
          });
        }
      });

      setCareers(careersList);
      setSubjects(Array.from(allSubjectsMap.values()));

      // Fetch Site Images
      const heroImageRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/siteSettings", "heroImage");
      const heroImageSnap = await getDoc(heroImageRef);
      
      const heroImageData: SiteImage = {
        id: 'heroImage',
        name: 'Imagen Principal (Hero)',
        description: 'La imagen principal de la página de inicio.',
        imageUrl: heroImageSnap.exists() ? heroImageSnap.data().imageUrl : ""
      };
      setSiteImages([heroImageData]);

    } catch (error) {
      console.error("Error fetching media data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaData();
  }, [fetchMediaData]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestión de Media"
        description="Administra las imágenes de carreras, materias e imágenes del sitio."
        icon={<ImageIcon className="h-8 w-8 text-primary" />}
      />

      <Tabs defaultValue="site">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="site">Imágenes del Sitio</TabsTrigger>
          <TabsTrigger value="careers">Carreras</TabsTrigger>
          <TabsTrigger value="subjects">Materias</TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes Generales del Sitio</CardTitle>
              <CardDescription>Gestiona imágenes importantes como el banner principal.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {isLoading ? (
                Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-64" />)
              ) : (
                siteImages.map(item => (
                  <Card key={item.id}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base truncate">{item.name}</CardTitle>
                       <CardDescription className="text-xs truncate">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden mb-4">
                        {item.imageUrl && (item.imageUrl.startsWith("http") || item.imageUrl.startsWith("data:image")) ? (
                          <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Clapperboard className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <MediaManagementDialog
                        documentId={item.id}
                        documentName={item.name}
                        collectionName="siteSettings"
                        currentImageUrl={item.imageUrl}
                        onUpdate={fetchMediaData}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="careers">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes de Carreras</CardTitle>
              <CardDescription>Sube o actualiza la imagen principal para cada programa académico.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)
              ) : (
                careers.map(item => (
                  <Card key={item.id}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base truncate">{item.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden mb-4">
                        {item.imagenURL && (item.imagenURL.startsWith("http") || item.imagenURL.startsWith("data:image")) ? (
                          <Image src={item.imagenURL} alt={item.nombre} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <MediaManagementDialog
                        documentId={item.id}
                        documentName={item.nombre}
                        collectionName="carreras"
                        currentImageUrl={item.imagenURL}
                        onUpdate={fetchMediaData}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
           <Card>
            <CardHeader>
              <CardTitle>Imágenes de Materias (Generadas Automáticamente)</CardTitle>
              <CardDescription>Imágenes de patrones abstractos y únicos para cada materia.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)
              ) : (
                subjects.map(item => {
                    const seed = getSeedFromString(item.id || item.nombre);
                    const imageUrl = `https://www.gravatar.com/avatar/${seed}?d=identicon&s=400`;
                    return (
                        <Card key={item.id}>
                            <CardHeader className="p-4">
                                <CardTitle className="text-base truncate">{item.nombre}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                                    <Image 
                                        src={imageUrl} 
                                        alt={`Patrón abstracto para ${item.nombre}`} 
                                        fill 
                                        style={{ objectFit: 'cover' }}
                                        data-ai-hint="abstract geometric"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Career {
  id: string;
  nombre: string;
  imagenURL?: string;
}

interface SiteImage {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
}

