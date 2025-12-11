'use client';

import Link from 'next/link';

const steps = [
  {
    title: 'Como cancelar',
    description:
      'A renovação do plano GiroPro+ pode ser cancelada diretamente no painel de assinatura ou solicitada ao suporte. Assim que o cancelamento é registrado, nenhuma nova cobrança é gerada.',
  },
  {
    title: 'Período ativo',
    description:
      'Após cancelar, você mantém acesso aos recursos Pro até o fim do ciclo já pago. Ao término do ciclo, sua conta volta automaticamente ao plano gratuito.',
  },
  {
    title: 'Reembolsos',
    description:
      'Se houver cobrança indevida (por exemplo, renovação após cancelamento confirmado), contate o suporte em até 7 dias corridos para analisarmos o caso e realizarmos o estorno quando aplicável.',
  },
  {
    title: 'Alteração de meio de pagamento',
    description:
      'Para trocar cartão/Pix, cancele a assinatura atual e realize um novo checkout. O histórico e os dados do veículo permanecem salvos.',
  },
];

export default function CancelamentoPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold">Documentação legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Política de Cancelamento e Reembolso</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transparência sobre como cancelar sua assinatura GiroPro+ e quando há reembolso.
          </p>
        </header>

        <div className="space-y-6">
          {steps.map((step) => (
            <section key={step.title} className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
              <h2 className="text-xl font-black mb-2">{step.title}</h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.description}</p>
            </section>
          ))}
        </div>

        <footer className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            Precisa de ajuda? Entre em contato pelo suporte no aplicativo ou pelo e-mail oficial do GiroPro.
          </p>
          <p>
            Veja também os <Link href="/termos" className="text-orange-600 font-semibold">Termos de Serviço</Link> e a{' '}
            <Link href="/privacidade" className="text-orange-600 font-semibold">Política de Privacidade</Link>.
          </p>
        </footer>
      </div>
    </main>
  );
}
