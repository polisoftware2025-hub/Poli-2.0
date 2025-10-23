
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

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
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <GraduationCap className="h-16 w-16 text-cyan-300" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 font-poppins text-xl font-semibold text-cyan-200"
            >
              Cargando tu panel...
            </motion.p>
             <div className="flex items-center justify-center gap-1 mt-2">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-cyan-400"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
