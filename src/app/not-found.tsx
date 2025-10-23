
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section 
        className="flex items-center justify-center min-h-screen bg-white font-poppins"
        style={{
            backgroundImage: "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}
    >
      <div className="w-full max-w-4xl mx-auto text-center">
        <div className="relative h-96">
            <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-8xl font-black text-gray-800" style={{fontSize: '10rem'}}>
                404
            </h1>
        </div>
        <div className="mt-[-50px]">
          <h3 className="text-4xl font-bold text-gray-800">
            Parece que estás perdido
          </h3>
          <p className="text-lg text-gray-600 my-4">
            La página que buscas no está disponible.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg font-semibold bg-[#004aad] hover:bg-[#003a8c] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <Link href="/">
              Volver al Inicio
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
