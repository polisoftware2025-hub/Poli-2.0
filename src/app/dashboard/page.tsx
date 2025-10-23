
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    // A small delay to prevent flickering while redirecting
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
       <div className="relative flex min-h-screen flex-col items-center justify-center p-4 polygon-bg overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="z-10 w-full max-w-sm rounded-2xl border-cyan-300/20 bg-black/30 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-lg"
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            
            <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
                <div className="wheel">
                    <div className="spoke"></div>
                    <div className="spoke"></div>
                    <div className="spoke"></div>
                    <div className="spoke"></div>
                    <div className="spoke"></div>
                    <div className="spoke"></div>
                </div>
                <div className="hamster">
                    <div className="hamster__body">
                        <div className="hamster__head">
                            <div className="hamster__ear"></div>
                            <div className="hamster__eye"></div>
                            <div className="hamster__nose"></div>
                        </div>
                        <div className="hamster__limb hamster__limb--fr"></div>
                        <div className="hamster__limb hamster__limb--fl"></div>
                        <div className="hamster__limb hamster__limb--br"></div>
                        <div className="hamster__limb hamster__limb--bl"></div>
                    </div>
                </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 font-poppins text-xl font-semibold text-cyan-200"
            >
              Redirigiendo a tu panel...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
