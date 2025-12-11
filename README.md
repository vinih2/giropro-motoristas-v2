# GiroPro Motoristas
Calculadora de lucro real e assistente para motoristas de app. App em Next.js com Supabase, IA e PWA.

## Stack
- Next.js 15 (App Router) + Turbopack no `npm run dev`
- Supabase (auth, banco, storage)
- Tailwind 4 + Radix UI + shadcn/ui
- Vitest (testes)
- next-pwa (PWA; desabilitado em desenvolvimento)

## Requisitos
- Node 20+
- npm 10+
- Conta Supabase com projeto ativo (URL e anon key)
- Chaves externas: Groq (IA), OpenWeather (clima), Google Maps (mapa) e WhatsApp Cloud se for usar o disparo

## Setup rápido
1) Instale dependências:
```bash
npm install
```
2) Crie `.env.local` na raiz (ver seção de variáveis).
3) Rode em desenvolvimento:
```bash
npm run dev
```
Abra `http://localhost:3000`.

## Variáveis de ambiente
Crie `.env.local` com as chaves do seu projeto. Exemplo (substitua pelos valores reais):
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

GROQ_API_KEY=...
OPENWEATHER_API_KEY=...

# WhatsApp Cloud (opcional)
WA_PHONE_NUMBER_ID=...
WA_BUSINESS_ACCOUNT_ID=...
WA_ACCESS_TOKEN=...

# Google Maps (opcional para mapas/geocoding)
GOOGLE_MAPS_KEY=...
```
Sempre reinicie `npm run dev` ao trocar `.env.local`.

## Scripts
- `npm run dev` – servidor local com Turbopack.
- `npm run build` – build de produção.
- `npm start` – servidor de produção após o build.
- `npm run lint` – lint.
- `npm test` – Vitest.

## Funcionalidades
- Calculadora de lucro real (ganho, km, custo/km) com metas diárias.
- Checklist de manutenção e alertas (licenciamento, seguro, financiamento).
- Resumo do dia e streak de consistência.
- Coach/IA para insights e clima.
- Lead e paywall GiroPro+ (CTA via WhatsApp).
- PWA com manifest e ícones (offline básico).

## Estrutura rápida
- `src/app/page.tsx` – dashboard principal e landing.
- `src/components` – UI e blocos de landing/dash.
- `src/hooks` – auth (`useAuth`), perfil (`useUserProfile`).
- `src/services/giroService.ts` – chamadas Supabase.
- `public/` – ícones, manifest, assets do PWA.

## Deploy (Vercel sugerido)
1) Configure as mesmas variáveis de ambiente no painel da Vercel.
2) Garanta que o projeto Supabase esteja ativo (pausar derruba refresh tokens).
3) `next-pwa` gera os assets na pasta `public` (já versionada). Em produção o PWA fica habilitado.

## Troubleshooting
- **Invalid Refresh Token / Refresh Token Not Found**: limpar storage/cookies `sb-...` e logar de novo; acontece quando o projeto Supabase foi pausado ou recriado.
- **PWA não registra em dev**: é esperado; o service worker fica desabilitado em `NODE_ENV=development`.
- **404 em `apple-touch-icon.png`**: os ícones já estão em `public/`; se trocar, mantenha os nomes `icon.svg`, `apple-touch-icon.png` e `manifest.json`.

## Analytics (Supabase)
Eventos são gravados em `analytics_events` via `logAnalyticsEvent`, ex.: `onboarding_completed`, `tax_report_generated`, `coach_analysis_generated`, `pro_cta_clicked`, `pro_upgrade_success`. Query exemplo:
```sql
select event, count(*) as total, date_trunc('day', created_at) as dia
from analytics_events
where created_at >= now() - interval '30 days'
group by 1, 3
order by dia desc;
```
