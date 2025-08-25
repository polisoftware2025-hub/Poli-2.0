
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function StudentDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (storedEmail && userRole === 'estudiante') {
      setUserEmail(storedEmail);
    } else if (storedEmail) {
       router.push('/dashboard');
    }
    else {
      router.push('/login');
    }
  }, [router]);
  
  if (!userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
       <Card>
           <CardHeader>
               <CardTitle className="font-poppins text-2xl font-bold text-gray-800">
                  ¡Bienvenido de vuelta, estudiante!
               </CardTitle>
               <CardDescription className="font-poppins text-gray-600">
                  Este es tu panel de control. Desde aquí puedes gestionar tus cursos, ver tus calificaciones y mucho más.
               </CardDescription>
           </CardHeader>
           <CardContent>
               <p className="text-gray-700">Has iniciado sesión como: <span className="font-semibold text-[#004aad]">{userEmail}</span></p>
           </CardContent>
       </Card>
    </div>
  );
}
