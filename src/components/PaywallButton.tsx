"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function PaywallButton({ 
  priceLabel = "Assinar Pro+",
  variant = "default",
  size = "default",
  fullWidth = false
}: { 
  priceLabel?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? undefined;

      if (!token) {
        alert("Faça login para continuar");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (json?.url) {
        window.location.href = json.url;
      } else {
        alert("Erro ao criar sessão de checkout");
        console.error(json);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      variant={variant}
      size={size}
      className={fullWidth ? "w-full" : ""}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        priceLabel
      )}
    </Button>
  );
}
