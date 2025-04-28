// src/app/api/attendance/history/route.ts

export async function GET() {
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbwvSNLeclCpf0NNnS4L0q5Oewd8GNCmUcn3n44gq_y7GQRAL2ue48zOEoz1DPXJerKY/exec"
  ); // ← 正しいGAS URLにする！
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
