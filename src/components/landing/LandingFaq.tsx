'use client';

const FAQS = [
  {
    q: 'Preciso colocar cartão para começar?',
    a: 'Não. O plano Free é liberado só com e-mail e WhatsApp. Você só ativa o Pro+ quando quiser e pode cancelar pelo app.',
  },
  {
    q: 'Uso Uber, 99 e particular. Ele dá conta?',
    a: 'Sim. Você separa ganhos por plataforma, registra custo real e a IA sugere missão de acordo com o app que estiver rodando.',
  },
  {
    q: 'Consigo gerar DARF e comprovante de renda?',
    a: 'Sim. No Pro+ você calcula a DARF completa, marca como paga e exporta PDF assinado para banco, locadora ou imobiliária.',
  },
  {
    q: 'Como funciona o suporte?',
    a: 'No Pro+ você fala com um especialista do time Giro em até 5 minutos direto do app ou WhatsApp. No Free seguimos via e-mail.',
  },
  {
    q: 'Como importo meu histórico de corridas do Uber/99?',
    a: 'É moleza! Clique em "Importar" no dashboard, faça upload do CSV do seu histórico de viagens, revise os dados e pronto. Tudo entra automático. Sua tarefa é só extrair: No Uber abra "Histórico" → "Exportar" → CSV. Na 99 acesse o histórico de viagens e faça download do relatório em CSV.',
  },
  {
    q: 'Preciso digitar cada corrida manualmente?',
    a: 'Não! Use o import de CSV para trazer histórico em lote. Ou registre corridas novas rapidinho (4 campos) no dashboard. Se quiser ainda mais rápido, use o input por voz que a gente reconhece o valor automaticamente.',
  },
  {
    q: 'Qual formato de arquivo vocês aceitam?',
    a: 'CSV padrão (Uber/99 exportam assim). Se tiver fotos de corrida, mande print que a gente lê com OCR em breve. Por enquanto, melhor extrair o CSV direto do app da plataforma.',
  },
];

export function LandingFaq() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-zinc-950/50">
      <div className="container mx-auto px-6 max-w-4xl space-y-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">FAQ</p>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Dúvidas de quem já vive do app</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((item) => (
            <details key={item.q} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              <summary className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer">{item.q}</summary>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
