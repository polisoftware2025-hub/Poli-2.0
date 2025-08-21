"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function DashboardPage() {
  const auth = getAuth(app);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };
  
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Cargando...</p>
        </div>
    )
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-roboto">
      <Card className="w-full max-w-lg rounded-xl shadow-lg">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#002147]">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
            ¡Bienvenido de vuelta!
          </CardTitle>
          <CardDescription className="font-poppins text-gray-600">
            Estamos contentos de tenerte aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-gray-700">
            Has iniciado sesión como: <br/>
            <span className="font-semibold text-[#004aad]">{user.email}</span>
          </p>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="mt-8 w-full rounded-full py-6 text-base font-semibold"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
