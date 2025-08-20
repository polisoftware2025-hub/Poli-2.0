"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-[#004080] text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="font-poppins text-2xl font-bold">Poli Intl.</h2>
        </div>
        <nav className="mt-8 flex flex-col space-y-2 px-4">
          <a
            href="#inicio"
            className="flex items-center gap-3 rounded-md bg-[#0066cc] px-4 py-3 font-semibold transition-colors hover:bg-[#005bb5]"
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </a>
          <a
            href="#inscripcion"
            className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors hover:bg-[#005bb5]"
          >
            <UserPlus className="h-5 w-5" />
            <span>Inscripción</span>
          </a>
          <a
            href="#contacto"
            className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors hover:bg-[#005bb5]"
          >
            <Mail className="h-5 w-5" />
            <span>Contacto</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header for Mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white p-4 shadow-md md:hidden">
          <h2 className="font-poppins text-xl font-bold text-[#004080]">
            Poli Intl.
          </h2>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-[#004080]"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
              ></path>
            </svg>
          </button>
        </header>

        <main className="p-6 md:p-10">
          <section
            id="inicio"
            className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center"
          >
            <h1 className="font-poppins text-5xl font-bold text-gray-800 md:text-7xl">
              Bienvenido al Politécnico Internacional
            </h1>
            <p className="mt-4 text-lg text-gray-600 md:text-xl">
              Tu futuro profesional comienza aquí.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                className="rounded-full bg-[#0066cc] px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105 hover:bg-[#005bb5]"
              >
                <Link href="#inicio-sesion">Iniciar Sesión</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-[#28a745] px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105 hover:bg-[#218838]"
              >
                <Link href="#inscripcion">Inscribirse</Link>
              </Button>
            </div>
          </section>

          <section id="inscripcion" className="py-20">
            <Card className="mx-auto max-w-4xl bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <CardContent>
                <h3 className="font-poppins text-center text-3xl font-bold text-gray-800">
                  Sobre Nuestra Institución
                </h3>
                <p className="mt-4 text-center text-gray-600">
                  El Politécnico Internacional es una institución comprometida
                  con la excelencia académica y la formación de profesionales
                  íntegros. Ofrecemos programas innovadores, un cuerpo docente
                  altamente calificado y una infraestructura de vanguardia para
                  garantizar una experiencia educativa de primer nivel.
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="contacto" className="py-20 text-center">
            <h3 className="font-poppins text-3xl font-bold text-gray-800">
              Contacto
            </h3>
            <p className="mt-4 text-gray-600">
              ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
            </p>
            <p className="mt-2 font-semibold text-[#004080]">
              info@politecnicointernacional.edu
            </p>
            <Button
              asChild
              className="mt-6 rounded-full bg-[#0066cc] px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-105 hover:bg-[#005bb5]"
            >
              <a href="mailto:info@politecnicointernacional.edu">Escríbenos</a>
            </Button>
          </section>
        </main>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
