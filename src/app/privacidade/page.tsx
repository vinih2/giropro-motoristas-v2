'use client';

import Link from 'next/link';

const sections = [
  {
    title: 'Dados coletados',
    items: [
      'Informações de perfil: nome, e-mail, cidade padrão e status de assinatura.',
      'Dados operacionais: registros de giros (ganho bruto, km, horas), custos do veículo, alertas de manutenção e configurações de metas.',
      'Dados técnicos: logs de acesso, dispositivo e cookies estritamente necessários para autenticação.',
    ],
  },
  {
    title: 'Finalidade do tratamento',
    items: [
      'Oferecer dashboards, simuladores, alertas de manutenção e insights de IA.',
      'Processar pagamentos e controlar o status do plano GiroPro+.',
      'Gerar relatórios tributários e documentos solicitados pelo usuário.',
    ],
  },
  {
    title: 'Compartilhamento',
    items: [
      'Supabase para banco de dados e autenticação.',
      'Gateways de pagamento (Stripe/Pagar.me/Pix) para processar cobranças.',
      'APIs de mapas e clima para mostrar hotspots e previsões.',
      'Não vendemos dados pessoais a terceiros.',
    ],
  },
  {
    title: 'Segurança',
    items: [
      'Criptografia em repouso no Supabase e comunicação via HTTPS.',
      'Acesso restrito com autenticação e monitoramento de eventos críticos.',
      'Backups automáticos e logs de auditoria para rastrear alterações sensíveis.',
    ],
  },
  {
    title: 'Direitos do titular',
    items: [
      'Consultar, corrigir ou excluir dados pessoais via suporte.',
      'Solicitar exportação dos dados em formato estruturado.',
      'Revogar consentimento ou cancelar a assinatura a qualquer momento.',
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold">Documentação legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta política explica como tratamos os seus dados pessoais dentro do GiroPro Motoristas e do plano GiroPro+.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
              <h2 className="text-xl font-black mb-3">{section.title}</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            Para exercer seus direitos ou esclarecer dúvidas, envie um e-mail para o suporte informado no aplicativo.
          </p>
          <p>
            Consulte também os <Link href="/termos" className="text-orange-600 font-semibold">Termos de Serviço</Link> e a{' '}
            <Link href="/cancelamento" className="text-orange-600 font-semibold">Política de Cancelamento</Link>.
          </p>
        </footer>
      </div>
    </main>
  );
}
