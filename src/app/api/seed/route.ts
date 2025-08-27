
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    return NextResponse.json({ message: "Endpoint obsoleto. Utilice /api/seed/carrera o /api/seed/grupos" }, { status: 404 });
}

    