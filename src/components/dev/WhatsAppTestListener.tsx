// src/components/dev/WhatsAppTestListener.tsx
"use client";

import { useEffect, useRef } from "react";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { toast } from "sonner";

export default function WhatsAppTestListener() {
  const sendingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;

    const handler = async () => {
      if (sendingRef.current) return;
      const numero = prompt("Número com DDD (somente dígitos). Ex: 11999999999");
      if (!numero) return;
      const sanitized = numero.replace(/\D/g, "");
      if (!sanitized) {
        toast.error("Número inválido.");
        return;
      }

      sendingRef.current = true;
      try {
        await sendWhatsAppMessage(
          `55${sanitized}`,
          "🚀 Teste de notificação GiroPro via WhatsApp Cloud."
        );
        toast.success("Mensagem enviada via WhatsApp Cloud.");
      } catch (error: unknown) {
        const description =
          error instanceof Error ? error.message : "Verifique o template ou token.";
        toast.error("Erro ao enviar WhatsApp.", {
          description,
        });
      } finally {
        sendingRef.current = false;
      }
    };

    window.addEventListener("whatsapp:test", handler as EventListener);
    return () => window.removeEventListener("whatsapp:test", handler as EventListener);
  }, []);

  return null;
}
