// Migração do modo manual de barras (bars: BarSlice[], sem `categorical`)
// pro modo categórico atual — BarChartConfig.categorical é obrigatório
// agora, e várias leituras fazem `config.categorical!`. Sem isso, qualquer
// usuário com barras salvas no modo antigo (localStorage['pbi-bars']) quebra
// ao entrar na aba "bars" (tela branca — mesma classe de bug já corrigida
// em cd78769/e0bc041).
//
// Não existe mapeamento fiel de N medidas independentes (modo antigo) pra
// 1 coluna + 1 medida ranqueada (modo categórico) — em vez de tentar
// adivinhar, preserva os campos gerais do card (título, cores, tamanho) e
// anexa um categorical vazio/seguro, que os helpers downstream já tratam
// via `cat.column || '""'` / `cat.measurePlaceholder || "0"`.
import { BarChartConfig } from '../types';

export function migrateBarConfig(bar: any): BarChartConfig {
  if (bar && bar.categorical) return bar as BarChartConfig;
  const { bars: _legacySlices, ...rest } = bar || {};
  return {
    ...rest,
    categorical: {
      column: '', measurePlaceholder: '',
      maxCategoriesMode: 'fixed', maxCategories: 5,
      sortBy: 'value_desc', sortEnabled: true, useGradient: false,
    },
  };
}
