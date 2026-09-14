// utils/chartTypes/index.ts
//
// Fase 4: ponto único de registro dos tipos de gráfico que implementam o
// contrato (./contract.ts). A promessa que a fase inteira existe pra
// cumprir: adicionar um tipo novo = criar os arquivos dele + 1 entrada
// aqui — nenhuma outra edição em código compartilhado já existente deveria
// ser necessária. É exatamente isso que a prova de conceito da barra
// (etapa 5) vai testar, com npm test como rede de segurança.
//
// Vazio por enquanto — a barra se registra aqui quando a etapa 5 acontecer.

import { ChartTypeDefinition } from './contract';
import { barChartType } from './bar/barChartType';

export const chartTypeRegistry: Record<string, ChartTypeDefinition<any>> = {
  bar: barChartType,
};
