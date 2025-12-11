// src/lib/whatsapp.ts
export async function sendWhatsAppTemplate(to: string, templateName: string, params: string[] = [], language = "pt_BR") {
  const res = await fetch("/api/whatsapp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, templateName, params, language }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Erro ao enviar mensagem no WhatsApp.");
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const res = await fetch("/api/whatsapp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Erro ao enviar mensagem no WhatsApp.");
  }
}
