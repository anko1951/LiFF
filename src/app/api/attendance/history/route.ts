// src/app/api/attendance/history/route.ts

export async function GET() {
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbyJEs_Gx2SSjU18PINo881ANlnv7BnADVJSBfgpINvxTXfvVi-gO_iLnQJWjSfbGUgk/exec"
  ); // ← 正しいGAS URLにする！
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
