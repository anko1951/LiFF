// src/app/api/attendance/history/route.ts

export async function GET() {
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbyFts1OiG-K5yLIaabUSoIyjzXXS5FTisBvfBakxALc-AL8cUkY6ZNjLKRezsC82__e/exec"
  ); // ← 正しいGAS URLにする！
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
