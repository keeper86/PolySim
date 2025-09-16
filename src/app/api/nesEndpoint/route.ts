import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/nesEndpoint:
 *   get:
 *     description: Returns the hello world
 *     responses:
 *       200:
 *         description: Hello World!
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
