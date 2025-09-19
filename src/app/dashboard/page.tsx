
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
      router.replace('/login');
      return;
    }

    let targetDashboard = '/dashboard/estudiante'; // Default dashboard

    if (userRole === 'rector') {
        targetDashboard = '/dashboard/admin'; // Rector can use admin dashboard as main panel
    } else if (userRole === 'admin') {
      targetDashboard = '/dashboard/admin';
    } else if (userRole === 'gestor') {
      targetDashboard = '/dashboard/gestor';
    } else if (userRole === 'docente') {
      targetDashboard = '/dashboard/docente';
    }

    router.replace(targetDashboard);
    
  }, [router]);

  useEffect(() => {
    // A small delay to prevent flickering while redirecting
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">Cargando tu panel de control...</p>
              <div className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
          </div>
      </div>
    );
  }

  return null;
}

    