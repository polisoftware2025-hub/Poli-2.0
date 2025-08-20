
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Mail, UserPlus, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-6 py-4 shadow-md lg:hidden">
        <h2 className="font-poppins text-xl font-bold text-[#003366]">Poli Intl.</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-[#003366] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="font-poppins text-2xl font-bold">Poli Intl.</h2>
        </div>
        <nav className="mt-8 flex flex-col space-y-2 px-4">
          <Link
            href="#inicio"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md bg-[#0066cc] px-4 py-3 font-semibold transition-colors hover:bg-[#005bb5]"
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </Link>
          <Link
            href="#inscripcion"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors hover:bg-[#005bb5]"
          >
            <UserPlus className="h-5 w-5" />
            <span>Inscripción</span>
          </Link>
          <Link
            href="#contacto"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors hover:bg-[#005bb5]"
          >
            <Mail className="h-5 w-5" />
            <span>Contacto</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <main>
          {/* Banner Section */}
          <section
            id="inicio"
            className="relative flex min-h-screen items-center justify-center text-center text-white"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src="https://placehold.co/1920x1080.png"
                alt="Estudiantes universitarios"
                layout="fill"
                objectFit="cover"
                className="brightness-50"
                data-ai-hint="students university technology"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center p-6">
              <h1 className="font-poppins text-5xl font-bold md:text-7xl">
                Bienvenido al Politécnico Internacional
              </h1>
              <p className="mt-4 text-lg md:text-xl">
                Tu futuro profesional comienza aquí.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  className="rounded-full bg-[#0066cc] px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105 hover:bg-[#005bb5]"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  className="rounded-full bg-[#28a745] px-8 py-6 text-lg font-semibold text-white transition-transform hover:scale-105 hover:bg-[#218838]"
                >
                  Inscríbete
                </Button>
              </div>
            </div>
          </section>

          {/* Info Card Section */}
          <section id="inscripcion" className="bg-white py-20">
            <div className="container mx-auto max-w-4xl px-6">
              <Card className="bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <CardContent>
                  <p className="text-center text-lg text-gray-700">
                    El Politécnico Internacional se compromete con la formación de profesionales de calidad en Colombia.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contacto" className="bg-gray-100 py-20">
            <div className="container mx-auto px-6 text-center">
              <h3 className="font-poppins text-3xl font-bold text-gray-800">
                Contacto
              </h3>
              <p className="mt-4 text-gray-600">
                ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
              </p>
              <p className="mt-2 font-semibold text-[#003366]">
                info@politecnicointernacional.edu
              </p>
              <Button
                asChild
                className="mt-6 rounded-full bg-[#0066cc] px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-105 hover:bg-[#005bb5]"
              >
                <a href="mailto:info@politecnicointernacional.edu">Escríbenos</a>
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
