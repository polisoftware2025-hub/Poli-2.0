
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Briefcase } from "lucide-react";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <User className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                Mi Perfil
              </CardTitle>
              <CardDescription className="font-poppins text-gray-600">
                Visualiza y actualiza tu información personal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">
                <User className="mr-2 h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 h-4 w-4" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="academic">
                <Briefcase className="mr-2 h-4 w-4" />
                Académico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">Primer Nombre</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Primer Apellido</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" defaultValue={userEmail || ''} disabled />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" defaultValue="3001234567" />
                  </div>
                   <div>
                    <Label htmlFor="idType">Tipo de Identificación</Label>
                    <Select defaultValue="cc">
                        <SelectTrigger id="idType">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                            <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="idNumber">Número de Identificación</Label>
                    <Input id="idNumber" defaultValue="1234567890" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" defaultValue="Calle Falsa 123, Springfield" />
                  </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button>Guardar Cambios</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="security" className="mt-6">
               <form className="space-y-6">
                <div>
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input id="currentPassword" type="password" />
                </div>
                <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" />
                </div>
                <div>
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmPassword" type="password" />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button>Cambiar Contraseña</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="academic" className="mt-6">
              <div className="space-y-4">
                  <div>
                    <Label>Carrera</Label>
                    <p className="text-sm font-medium text-gray-800">Ingeniería de Sistemas</p>
                  </div>
                   <div>
                    <Label>Periodo Académico Actual</Label>
                    <p className="text-sm font-medium text-gray-800">2024-2</p>
                  </div>
                   <div>
                    <Label>Jornada</Label>
                    <p className="text-sm font-medium text-gray-800">Diurna</p>
                  </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
