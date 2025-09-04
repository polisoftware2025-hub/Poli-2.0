
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import { MediaManagementDialog } from "@/components/dashboard/admin/media-management-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Materia } from "@/types";
import { ImageIcon } from "lucide-react";

interface Career {
  id: string;
  nombre: string;
  imagenURL?: string;
}

export default function MediaManagementPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [subjects, setSubjects] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchMediaData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Careers
      const careersSnapshot = await getDocs(collection(db, "Politecnico/mzIX7rzezDezczAV6pQ7/carreras"));
      const careersList = careersSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        imagenURL: doc.data().imagenURL || "",
      }));
      setCareers(careersList);

      // Fetch Subjects from all careers
      const allSubjectsMap = new Map<string, Materia>();
      careersSnapshot.forEach(careerDoc => {
        const careerData = careerDoc.data();
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
      setSubjects(Array.from(allSubjectsMap.values()));

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
        description="Administra las imágenes de carreras y materias."
        icon={<ImageIcon className="h-8 w-8 text-primary" />}
      />

      <Tabs defaultValue="careers">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="careers">Carreras</TabsTrigger>
          <TabsTrigger value="subjects">Materias</TabsTrigger>
        </TabsList>
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
                        {item.imagenURL ? (
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
              <CardTitle>Imágenes de Materias</CardTitle>
              <CardDescription>Define una imagen representativa para cada materia.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)
              ) : (
                subjects.map(item => (
                  <Card key={item.id}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base truncate">{item.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden mb-4">
                        {item.imagenURL ? (
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
                        collectionName="materias"
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
      </Tabs>
    </div>
  );
}
