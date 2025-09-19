
import { seedRectorUsers } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const result = await seedRectorUsers();
        if (result.success) {
            return NextResponse.json({ message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: 409 });
        }
    } catch (error) {
        console.error("Error en el endpoint /api/seed/rectors:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
