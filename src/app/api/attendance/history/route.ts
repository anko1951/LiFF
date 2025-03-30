// src/app/api/attendance/history/route.ts

export async function GET() {
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbwrq--Xx1A46623dyMxv3wfktkcgyAUNi2Hpmi-TjSg32jyGvwe8A3ybLFXb7f1CAec/exec"
  ); // ← 正しいGAS URLにする！
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
