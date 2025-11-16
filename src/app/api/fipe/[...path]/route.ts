// src/app/api/fipe/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

// Esta rota usa o padrão catch-all para criar um proxy reverso.
// Isso permite que o Next.js lide com caching de forma eficiente no servidor.

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Constrói o caminho completo da API FIPE (ex: /marcas/1/modelos)
    const fipePath = params.path.join('/');
    const urlCompleta = `${FIPE_BASE_URL}/${fipePath}`;

    // Acessa a API externa de forma segura no servidor
    const response = await fetch(urlCompleta);

    if (!response.ok) {
      return NextResponse.json({ error: `Erro na API FIPE: ${response.statusText}` }, { status: response.status });
    }

    // Estratégia de Cache: Cache de 1 dia (86400s) no Vercel Edge
    const headers = { 
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200', 
        'Content-Type': 'application/json' 
    };

    const data = await response.json();
    return NextResponse.json(data, { headers });

  } catch (error) {
    console.error('Erro no proxy FIPE:', error);
    return NextResponse.json({ error: 'Falha interna ao comunicar com API FIPE.' }, { status: 500 });
  }
}