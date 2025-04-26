export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbxxhR1rRXIr9yIoPA8gcT4hm4qMMbI8OONEGG5zIDHceVjPVrLmsIyFqWfYUKAia38c/exec",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
    });
  }

  const result = await res.json();

  return new Response(JSON.stringify({ success: true, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
