// src/app/api/attendance/history/route.ts

export async function GET() {
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbyX6L87a6l9dRRjkmHhd0zINc5oTCwR8KAOP-9kW2wUxcBatofZnNG2WA4GzyXCx6fd/exec"
  ); // ← 正しいGAS URLにする！
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
