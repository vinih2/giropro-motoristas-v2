// src/app/layout.tsx
"use client";

import "./globals.css";
import Navbar from "@/components/custom/navbar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/sonner";
import GiroGuardButton from "@/components/GiroGuardButton";
import PageTransition from "@/components/PageTransition";
import { PeriodProvider } from "@/context/PeriodContext";
import PeriodSelector from "@/components/PeriodSelector";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import WhatsAppTestListener from "@/components/dev/WhatsAppTestListener";
import { AuthProvider } from "@/context/AuthContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { WelcomeModal } from "@/components/WelcomeModal";
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Lógica de Persistência Supabase
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) localStorage.setItem("sb-session", JSON.stringify(session));
        else localStorage.removeItem("sb-session");
      }
    );

    // Recupera tema
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") document.documentElement.classList.add("dark");

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GiroPro" />
      </head>
      <body
        className="
          antialiased min-h-screen 
          bg-white dark:bg-black
          text-gray-800 dark:text-gray-100
          transition-colors duration-300
        "
      >
        <QueryProvider>
          <AuthProvider>
            <UserProfileProvider>
              <Navbar />
              <GiroGuardButton />
              <Toaster />

              <FeatureFlagsProvider>
                <PeriodProvider>
                  <main className="pb-24 pt-20 md:pt-24 md:pb-8">
                    <PeriodSelector />
                    <WhatsAppTestListener />
                    <PageTransition>{children}</PageTransition>
                  </main>
                  <WelcomeModal />
                </PeriodProvider>
              </FeatureFlagsProvider>
            </UserProfileProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
