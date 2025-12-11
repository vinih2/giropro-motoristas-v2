// src/app/api/whatsapp/send/route.ts
import { NextResponse } from "next/server";

const WHATSAPP_ENDPOINT = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

export async function POST(req: Request) {
  if (!process.env.WA_ACCESS_TOKEN || !process.env.WA_PHONE_NUMBER_ID) {
    return NextResponse.json(
      { error: "Missing WhatsApp credentials." },
      { status: 500 }
    );
  }

  const payload = await req.json();
  if (!payload?.to) {
    return NextResponse.json({ error: "Missing phone number." }, { status: 400 });
  }

  const isTemplate = Boolean(payload.templateName);
  const body = {
    messaging_product: "whatsapp",
    to: payload.to,
    type: isTemplate ? "template" : "text",
    ...(isTemplate
      ? {
          template: {
            name: payload.templateName,
            language: { code: payload.language ?? "pt_BR" },
            components: [
              {
                type: "body",
                parameters: (payload.params || []).map((text: string) => ({
                  type: "text",
                  text,
                })),
              },
            ],
          },
        }
      : {
          text: {
            body: payload.message,
          },
        }),
  };

  const response = await fetch(WHATSAPP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
