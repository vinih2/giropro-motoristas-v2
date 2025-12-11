// src/lib/calculations.ts

import { z } from 'zod';
import { 
  DadosDia, 
  ResultadoDia, 
  DadosCusto, 
  ResultadoCusto, 
  DadosSimulador, 
  ResultadoSimulador 
} from './types';

// --- Zod Schema para Validação e Tipagem do Formulário (Simulador Avançado) ---
export const GiroFormSchema = z.object({
  ganhos_brutos: z.number().min(0, "O ganho bruto deve ser positivo."),
  km_rodados: z.number().min(1, "Deve haver KM rodados para o cálculo."),
  consumo_medio: z.number().min(0.1, "O consumo não pode ser zero."),
  valor_combustivel: z.number().min(0.1, "O preço do combustível deve ser positivo."),
  comissao_app: z.number().min(0).max(1, "A comissão deve ser entre 0 e 100% (0 e 1)."), // Armazenado como decimal (ex: 0.25)
  outros_gastos: z.number().min(0, "Gastos não podem ser negativos.").default(0),
  tipo_combustivel: z.enum(["gasolina", "etanol", "diesel", "eletrico"]).default("gasolina"),
  cidade: z.string().optional(),
  depreciacao_por_km: z.number().min(0).optional(),
  // Campos opcionais para ID de usuário em contextos de banco de dados
  user_id: z.string().optional(),
});

// Tipo inferido do Zod para uso nos componentes
export type GiroInput = z.infer<typeof GiroFormSchema>;

export interface GiroResult {
  custo_combustivel: number;
  lucro_bruto: number;
  custo_total: number;
  lucro_liquido: number;
  lucro_por_km: number;
}

// --- FUNÇÕES DE CÁLCULO ---

/**
 * Função 1: Cálculo Rápido do Giro (Usada no Dashboard/Home)
 * Calcula o básico: Bruto - (CustoKM * KM)
 */
export function calcularGiroDia(dados: DadosDia, custoPorKm: number): ResultadoDia {
  const ganhoPorHora = dados.ganhoBruto / dados.horasTrabalhadas;
  const ganhoPorKm = dados.ganhoBruto / dados.kmRodados;
  const custoDiario = custoPorKm * dados.kmRodados;
  const lucroFinal = dados.ganhoBruto - custoDiario;

  return {
    ganhoPorHora: isFinite(ganhoPorHora) ? ganhoPorHora : 0,
    ganhoPorKm: isFinite(ganhoPorKm) ? ganhoPorKm : 0,
    custoDiario: isFinite(custoDiario) ? custoDiario : 0,
    lucroFinal: isFinite(lucroFinal) ? lucroFinal : 0,
  };
}

/**
 * Função 2: Cálculo Completo Pro (Usada no Simulador/Histórico)
 * Considera: Combustível + Depreciação (FIPE) + Outros Gastos + Taxa App
 */
export function calculateGiroPro(data: GiroInput): GiroResult {
  const { 
    ganhos_brutos, 
    km_rodados, 
    consumo_medio, 
    valor_combustivel, 
    comissao_app, 
    outros_gastos,
    depreciacao_por_km 
  } = data;
  
  // 1. Custo Energia/Combustível
  // Fórmula universal: (KM / Eficiência) * Preço Unitário
  const unidades_gastas = km_rodados / consumo_medio; // Litros ou kWh
  const custo_combustivel = unidades_gastas * valor_combustivel;
  
  // 2. Depreciação persistida
  const dep_por_km = depreciacao_por_km ?? 0;
  const custo_depreciacao = dep_por_km * km_rodados;
  
  // 3. Taxas e Outros
  // Se comissao_app for > 1 (ex: 25), assume porcentagem e divide por 100. Se < 1 (ex: 0.25), mantém.
  const taxa_real = comissao_app > 1 ? comissao_app / 100 : comissao_app;
  const custo_app = ganhos_brutos * taxa_real;
  
  // 4. Totais
  const custo_total = custo_combustivel + custo_depreciacao + outros_gastos + custo_app;
  const lucro_liquido = ganhos_brutos - custo_total;
  const lucro_bruto = ganhos_brutos - custo_app; // O que sobra na mão antes dos gastos do carro
  
  return {
    custo_combustivel,
    lucro_bruto,
    custo_total,
    lucro_liquido,
    lucro_por_km: km_rodados > 0 ? lucro_liquido / km_rodados : 0,
  };
}

/**
 * Função 3: Calculadora de Custo por KM (Página /custo-km)
 * Suporta Elétrico e Flex
 */
export function calcularCustoPorKm(dados: DadosCusto): ResultadoCusto {
  // Fórmula: Preço Unitário (R$/l ou R$/kWh) / Eficiência (km/l ou km/kWh)
  const custoPorKm = dados.precoCombustivel / dados.consumoMedio;
  const custoDiario = custoPorKm * dados.kmRodados;

  let comparacaoFlex;
  
  // Lógica específica para Flex (Gasolina vs Etanol)
  if (dados.tipoVeiculo === 'Carro Flex') {
    const precoGasolina = dados.precoCombustivel;
    const precoEtanol = dados.precoCombustivel * 0.7; // Regra dos 70% (estimativa base)
    
    const custoGasolina = precoGasolina / dados.consumoMedio;
    // Etanol rende aprox. 70% da gasolina, então o consumo (km/l) é menor
    const consumoEtanol = dados.consumoMedio * 0.7;
    const custoEtanol = precoEtanol / consumoEtanol; 
    
    // Na prática simplificada para o usuário:
    // Se ele inseriu o preço da gasolina, comparamos se valeria a pena o etanol a 70% do preço.
    // Uma lógica mais avançada pediria os dois preços. Aqui é uma estimativa.
    
    comparacaoFlex = {
      gasolina: custoGasolina,
      etanol: custoEtanol,
      melhorOpcao: (custoEtanol < custoGasolina ? 'Etanol' : 'Gasolina') as 'Gasolina' | 'Etanol',
    };
  }

  return {
    custoPorKm: isFinite(custoPorKm) ? custoPorKm : 0,
    custoDiario: isFinite(custoDiario) ? custoDiario : 0,
    comparacaoFlex,
  };
}

/**
 * Função 4: Simulador Mensal (Estimativa)
 */
export function calcularSimuladorMensal(dados: DadosSimulador): ResultadoSimulador {
  const lucroSemanal = (dados.ganhoDiarioMedio - dados.custoDiarioMedio) * dados.diasPorSemana;
  const lucroMensal = lucroSemanal * 4.33; // Média de semanas/mês

  return {
    lucroSemanal: isFinite(lucroSemanal) ? lucroSemanal : 0,
    lucroMensal: isFinite(lucroMensal) ? lucroMensal : 0,
  };
}

// --- UTILITÁRIOS DE FORMATAÇÃO ---

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function avaliarDesempenho(ganhoPorHora: number): { nivel: string; cor: string } {
  if (ganhoPorHora >= 30) return { nivel: 'Excelente 🚀', cor: 'text-emerald-600' };
  if (ganhoPorHora >= 20) return { nivel: 'Bom 👍', cor: 'text-blue-600' };
  if (ganhoPorHora >= 12) return { nivel: 'Médio ⚠️', cor: 'text-yellow-600' };
  return { nivel: 'Baixo 🔻', cor: 'text-red-600' };
}
