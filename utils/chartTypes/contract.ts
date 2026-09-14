// utils/chartTypes/contract.ts
//
// Fase 4, Etapa 2: contrato que um tipo de gráfico novo implementa pra se
// encaixar no app. Escopo desta fase (Etapa 1 já decidiu): card e donut
// NÃO são retrofitados pra isso agora — só a barra (prova de conceito) usa
// este contrato. Fica documentado pra quando mais tipos (ou um retrofit)
// vierem depois.
//
// Achado da conversa que motivou o campo `getConditionalTarget` abaixo:
// em card, a formatação condicional (Fase 2) colore a accent bar (uma
// faixa decorativa); numa barra, o alvo natural é o preenchimento da
// própria barra. O contrato não pode assumir "sempre accent bar" — cada
// tipo declara qual é sua própria superfície visual primária.
//
// CLARIFICAÇÃO DE ESCOPO DO CRITÉRIO "1 arquivo + 1 ponto de registro"
// (fechada explicitamente ao implementar a barra, não é desvio silencioso):
// esse critério protege a LÓGICA DE RENDERIZAÇÃO/GERAÇÃO — o motor validado
// nas Fases 1-3 (Preview.tsx/daxGenerator.ts não ganham lógica de negócio
// de um tipo novo dentro deles). Ele NÃO cobre a fiação de estado de nível
// de app (array de estado em App.tsx, aba em activeAppTab, seção no
// Editor.tsx) — isso segue o mesmo padrão que `donuts` já usa hoje, é custo
// normal de "adicionar uma feature de topo", não uma falha da arquitetura.
// Preview.tsx/daxGenerator.ts ganham, no máximo, um branch de DESPACHO PURO
// por tipo novo (`if (activeAppTab === 'bar') { chartTypeRegistry.bar.X(...) }`)
// — zero lógica de negócio do tipo ali. Ver utils/chartTypes/bar/ pra onde
// essa lógica de fato mora.

import type { ReactElement } from 'react';
import { GlobalConfig } from '../../types';

/** Contexto compartilhado que todo renderPreview recebe. */
export interface ChartPreviewContext {
  global: GlobalConfig;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** testValues efetivo (inclui entradas sintéticas de grupos categóricos, ver categoricalCards.ts) */
  testValues: Record<string, number>;
}

/** Contexto compartilhado que todo generateDax recebe. */
export interface ChartDaxContext {
  global: GlobalConfig;
  /** índice 1-based do item na lista — usado pra nomear VARs (_C{index}_...) */
  index: number;
}

/** Fragmento de DAX que um tipo de gráfico contribui — mesmo padrão de
 * concatenação `" & ... & "` já usado em daxGenerator.ts. */
export interface DaxFragment {
  /** Declarações VAR, injetadas antes do bloco de HTML. */
  vars: string;
  /** Trecho de HTML/DAX-string, seguindo a convenção de fechar com `" & `. */
  html: string;
}

export interface ChartTypeDefinition<TConfig> {
  /** Identificador único, ex: 'bar'. */
  id: string;

  /** Renderiza uma instância no preview (React). */
  renderPreview: (config: TConfig, ctx: ChartPreviewContext) => ReactElement;

  /** Gera o fragmento DAX (VARs + HTML) pra uma instância. */
  generateDax: (config: TConfig, ctx: ChartDaxContext) => DaxFragment;

  /**
   * Declara qual expressão (DAX) e qual valor (JS) representam a superfície
   * visual primária desse tipo, pra Fase 2 (formatação condicional) colorir.
   * Retorna null se o tipo não suporta formatação condicional.
   *
   * ESCOPO INTENCIONALMENTE ESTREITO — não "consertar" isso pra multi-valor:
   * este hook é só pra tipos de VALOR ÚNICO por instância (1 gráfico = 1
   * valor a colorir). Tipos multi-valor (barra — N fatias, cada uma com sua
   * própria cor condicional; o motor categórico da Fase 3 — N slots, mesma
   * ideia) NÃO passam por aqui. Eles chamam `buildConditionalSwitchDax`/
   * `resolveConditionalColor` (utils/conditionalFormatting.ts) diretamente,
   * uma vez por sub-valor, dentro do próprio `generateDax`/`renderPreview`,
   * e retornam `null` aqui. Essa é a reutilização real — este hook é só uma
   * conveniência de cima pros casos simples, não uma abstração universal.
   * Decisão registrada explicitamente na Fase 4, ao implementar a barra:
   * generalizar isso baseado numa amostra só (barra) seria prematuro — se um
   * segundo tipo multi-valor genuinamente diferente aparecer no futuro, essa
   * decisão é revisitada com mais evidência, não agora.
   */
  getConditionalTarget: (config: TConfig) => {
    /** Expressão DAX do valor bruto a comparar nas regras (ex: '_C1_Val_Raw'). */
    daxValueExpr: string;
    /** Cor estática de fallback quando nenhuma regra casa. */
    fallbackColor: string;
  } | null;
}
