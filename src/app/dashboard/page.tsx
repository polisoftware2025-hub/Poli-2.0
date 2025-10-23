
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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


  // This page just handles redirection, so it doesn't need to render anything itself.
  // The loader is now in the main dashboard layout.
  return null;
}
