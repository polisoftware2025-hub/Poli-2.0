
import { seedCarrera } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const result = await seedCarrera();
        if (result.success) {
            return NextResponse.json({ message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: 409 }); // 409 Conflict
        }
    } catch (error) {
        console.error("Error en el endpoint /api/seed/carrera:", error);
        return NextResponse.json({ message: "Error interno del servidor al intentar poblar la base de datos." }, { status: 500 });
    }
}

    