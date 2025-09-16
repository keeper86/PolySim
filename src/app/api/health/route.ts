import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/health:
 *   get:
 *     description: Returns the health status
 *     responses:
 *       200:
 *         description: OK
 */
export async function GET() {
    return NextResponse.json({ status: "ok" }, { status: 200 });
}
