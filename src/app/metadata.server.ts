import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GiroPro - Seu Coach Financeiro para Motoristas",
  description: "Calcule seu lucro real, custo por km e receba insights IA para ganhar mais como motorista ou entregador. Dashboard inteligente, DARF automático e GiroGarage.",
  keywords: ["motorista", "uber", "99", "iFood", "lucro", "custo km", "DARF", "simulador"],
  authors: [{ name: "GiroPro" }],
  openGraph: {
    type: "website",
    url: "https://giropro.com",
    title: "GiroPro - Seu Coach Financeiro para Motoristas",
    description: "Calcule seu lucro real e otimize seus ganhos com IA",
    images: [
      {
        url: "https://giropro.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GiroPro Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GiroPro - Seu Coach Financeiro para Motoristas",
    description: "Calcule seu lucro real e otimize seus ganhos com IA",
    images: ["https://giropro.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};
