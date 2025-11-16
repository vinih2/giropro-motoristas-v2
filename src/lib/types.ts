export type TipoVeiculo = 'Carro Flex' | 'Moto' | 'Elétrico' | 'Diesel';
export type Plataforma = 'Uber' | '99' | 'iFood' | 'Rappi' | 'Shopee' | 'Amazon' | 'Loggi' | 'Outro';

export interface DadosDia {
  plataforma: Plataforma;
  ganhoBruto: number;
  horasTrabalhadas: number;
  kmRodados: number;
}

export interface ResultadoDia {
  ganhoPorHora: number;
  ganhoPorKm: number;
  custoDiario: number;
  lucroFinal: number;
}

export interface DadosCusto {
  tipoVeiculo: TipoVeiculo;
  consumoMedio: number; // Para combustão (km/l) ou elétrico (km/kWh)
  precoCombustivel: number; // Para combustão (R$/l) ou elétrico (R$/kWh)
  kmRodados: number;
}

export interface ResultadoCusto {
  custoPorKm: number;
  custoDiario: number;
  comparacaoFlex?: {
    gasolina: number;
    etanol: number;
    melhorOpcao: 'Gasolina' | 'Etanol';
  };
}