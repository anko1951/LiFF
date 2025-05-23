export async function POST(req: Request) {
  const body = await req.json();

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwvSNLeclCpf0NNnS4L0q5Oewd8GNCmUcn3n44gq_y7GQRAL2ue48zOEoz1DPXJerKY/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await response.text();
    console.log("🟢 GASレスポンス:", text);

    try {
      const result = JSON.parse(text);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from GAS", raw: text }),
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("🔴 fetch失敗:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reach GAS", detail: String(err) }),
      { status: 500 }
    );
  }
}
