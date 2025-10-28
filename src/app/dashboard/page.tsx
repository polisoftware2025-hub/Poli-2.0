
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UniversityLoaderFull } from "@/components/ui/university-loader";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
      router.replace('/login');
      return;
    }

    let targetDashboard = '/dashboard/estudiante'; // Default dashboard

    if (userRole === 'rector') {
        targetDashboard = '/dashboard/rector'; 
    } else if (userRole === 'admin') {
      targetDashboard = '/dashboard/admin';
    } else if (userRole === 'gestor') {
      targetDashboard = '/dashboard/gestor';
    } else if (userRole === 'docente') {
      targetDashboard = '/dashboard/docente';
    }

    router.replace(targetDashboard);
    
  }, [router]);


  // Show a loader while redirecting. The main layout will handle the fuller loading experience.
  return <UniversityLoaderFull isLoading={true} text="Redirigiendo..." />;
}
