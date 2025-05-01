import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwofj6cTgJesbTIRgfk1FftK6jt-34hZFYJ7XMIxw6nNnHjCe6A9ge4wdFmh2LehYI1mg/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const html = await res.text();
      console.error("GASからHTMLが返ってきました:", html);
      return NextResponse.json({
        name: null,
        error: "GASからJSONではなくHTMLが返ってきました",
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("proxyToNameGAS error:", error);
    return NextResponse.json({ name: null, error: String(error) });
  }
}
