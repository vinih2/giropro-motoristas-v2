'use client';

import Link from 'next/link';

const sections = [
  {
    title: '1. Aceitação',
    body: [
      'Ao utilizar o GiroPro Motoristas você concorda com estes Termos de Serviço. Caso contrate o plano GiroPro+, você também concorda com as condições comerciais descritas nesta página e no checkout.',
    ],
  },
  {
    title: '2. Planos e Pagamentos',
    body: [
      'O plano gratuito oferece acesso limitado ao dashboard, histórico dos últimos giros e insights com cotas diárias.',
      'O plano GiroPro+ é uma assinatura recorrente mensal. A cobrança é processada pelo gateway informado no checkout (Stripe, Pix ou outro parceiro) e se renova automaticamente até cancelamento.',
    ],
  },
  {
    title: '3. Benefícios do GiroPro+',
    body: [
      'Histórico completo, relatórios oficiais e PDFs sem marca d’água.',
      'Compliance tributário com geração de DARF/DAS personalizados.',
      'GiroGarage avançado com DNA financeiro, alertas de manutenção e registro ilimitado.',
      'Hotspots em tempo real e mentoria GiroGuard/WhatsApp para suporte tático.',
      'Simulador Pro+ com cenários ilimitados e IA sem restrições diárias.',
    ],
  },
  {
    title: '4. Cancelamento e Reembolso',
    body: [
      'Você pode cancelar a renovação automática a qualquer momento pelos canais indicados na página de assinatura ou entrando em contato com nosso suporte.',
      'Assinaturas canceladas permanecem ativas até o fim do ciclo pago. Reembolsos seguem a nossa Política de Cancelamento.',
    ],
  },
  {
    title: '5. Responsabilidades',
    body: [
      'O usuário é responsável pela veracidade dos dados inseridos (km rodado, custos, documentos).',
      'O GiroPro não se responsabiliza por decisões financeiras tomadas com base nos insights. As funcionalidades são ferramentas para auxiliar a gestão.',
    ],
  },
  {
    title: '6. Privacidade',
    body: [
      'Os dados cadastrados são tratados conforme a nossa Política de Privacidade. Utilizamos Supabase e provedores de IA apenas para executar os serviços descritos.',
    ],
  },
];

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold">Documentação legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Termos de Serviço do GiroPro Motoristas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última atualização em {new Date().toLocaleDateString('pt-BR')}. Ao utilizar o aplicativo ou contratar o plano GiroPro+, você concorda com os termos abaixo.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
              <h2 className="text-xl font-black mb-2">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <footer className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            Precisa de ajuda? Entre em contato com nosso suporte via e-mail ou WhatsApp dentro do aplicativo.
          </p>
          <p>
            Consulte também a <Link href="/privacidade" className="text-orange-600 font-semibold">Política de Privacidade</Link> e a{' '}
            <Link href="/cancelamento" className="text-orange-600 font-semibold">Política de Cancelamento</Link>.
          </p>
        </footer>
      </div>
    </main>
  );
}
