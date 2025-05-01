// src/app/api/fetchName/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await req.json();

  try {
    const sheetId = "1ESiDQK6JBo9VwQG3H822u42GJ3iKojcbNkQ2tQOrG0g"; // ✅ ユーザー管理シートID
    const sheetName = "ユーザー管理"; // 必要ならシート名明示

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!C2:E100?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
    );

    const data = await res.json();
    const rows = data.values || [];

    const found = rows.find((row: string[]) => row[1]?.trim() === userId);

    if (!found) {
      return NextResponse.json({ name: null });
    }

    return NextResponse.json({ name: found[0] });
  } catch (error) {
    console.error("fetchName error:", error);
    return NextResponse.json({ name: null });
  }
}
