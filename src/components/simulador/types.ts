export type BaseScenario = {
  id: string;
  name: string;
  cidade: string;
  plataforma: string;
  horas: number;
  km: number;
  tarifaMedia: number;
  demanda: string;
};

export type Scenario = BaseScenario & {
  custom?: boolean;
  savedAt?: number;
  favorite?: boolean;
  tag?: string;
};

export type EnrichedScenario = Scenario & {
  ganho: number;
  lucro: number;
  ganhoHora: number;
  custo: number;
};
