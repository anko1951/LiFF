import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, type } = await req.json();
    if (!userId || !type) {
      throw new Error("Missing userId or type");
    }

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxdBRCRJgT-i7Nhbof2KxvVWohj7UtkDOAIMy3-TpD-oINp7RxB74RmjF5w9k_sW8Cj/exec",
      {
        method: "POST",
        mode: "cors", // CORS を明示
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google Apps Script returned ${
          response.status
        }: ${await response.text()}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
