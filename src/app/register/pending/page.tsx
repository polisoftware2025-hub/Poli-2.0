
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { PublicThemeHandler } from "@/components/ui/public-theme-handler";

export default function PendingApprovalPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center auth-bg p-4 font-poppins">
            <PublicThemeHandler />
            <Card className="w-full max-w-lg rounded-xl shadow-2xl text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <MailCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="font-poppins text-3xl font-bold text-gray-800">
                        ¡Solicitud Recibida!
                    </CardTitle>
                    <CardDescription className="font-poppins text-gray-600 pt-2">
                        Hemos recibido tu solicitud de inscripción correctamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700">
                        Tu solicitud está ahora en proceso de revisión por parte de nuestro equipo de admisiones.
                        Recibirás una notificación por correo electrónico una vez que el proceso haya finalizado.
                    </p>
                    <Button asChild className="mt-8 w-full rounded-full bg-[#004aad] py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700">
                        <Link href="/">Volver a la Página Principal</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
