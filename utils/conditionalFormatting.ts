// utils/conditionalFormatting.ts
//
// Fase 2: fonte única da lógica de "valor → cor" usada na accent bar do card.
//
// resolveConditionalColor() abaixo é a implementação de referência, usada
// diretamente por Preview.tsx (roda em JS, no browser). daxGenerator.ts NÃO
// importa esta função — não pode, o resultado dele é uma string DAX avaliada
// pelo motor do Power BI, sem JS em produção (mesma limitação documentada em
// visualConstants.ts desde a Fase 0.6). Em vez disso, buildConditionalSwitchDax()
// abaixo gera a MESMA lógica como uma expressão DAX `SWITCH(TRUE(), ...)`,
// mantida lado a lado neste arquivo de propósito — qualquer mudança na lógica
// de matching precisa ser replicada nas duas funções, e elas ficarem no mesmo
// arquivo é o que torna isso visível a quem for mexer aqui depois.

import { ConditionalRule } from '../types';

/** Avalia se um valor numérico casa com uma única regra. */
export function ruleMatches(value: number, rule: ConditionalRule): boolean {
  switch (rule.operator) {
    case '>': return value > rule.value;
    case '>=': return value >= rule.value;
    case '<': return value < rule.value;
    case '<=': return value <= rule.value;
    case '=': return value === rule.value;
    case 'between': return value >= rule.value && value <= (rule.value2 ?? rule.value);
    default: return false;
  }
}

/**
 * Resolve a cor final pra accent bar: primeira regra que casar (em ordem) vence;
 * sem regras, sem valor pra testar, ou nenhuma regra casando, cai no fallback
 * (o accentColor normal do card).
 */
export function resolveConditionalColor(
  value: number | undefined,
  rules: ConditionalRule[] | undefined,
  fallbackColor: string
): string {
  if (value === undefined || !rules || rules.length === 0) return fallbackColor;
  for (const rule of rules) {
    if (ruleMatches(value, rule)) return rule.color;
  }
  return fallbackColor;
}

/**
 * Gera o equivalente DAX de resolveConditionalColor(), como uma expressão
 * SWITCH(TRUE(), ...) — mesma semântica de "primeira regra que casar vence"
 * (SWITCH(TRUE(),...) já avalia em ordem e para no primeiro TRUE, igual ao
 * for+return acima). `valueExpr` é o texto DAX que representa o valor a
 * testar (ex.: "_C1_Val_Raw"). Retorna null se não há regras (nesse caso,
 * quem chama deve usar o accentColor estático direto, sem VAR nenhuma).
 */
export function buildConditionalSwitchDax(
  valueExpr: string,
  rules: ConditionalRule[] | undefined,
  fallbackColorExpr: string
): string | null {
  if (!rules || rules.length === 0) return null;

  const branches = rules.map(rule => {
    const condition = ruleToDaxCondition(valueExpr, rule);
    return `${condition}, "${rule.color}"`;
  }).join(', ');

  return `SWITCH(TRUE(), ${branches}, ${fallbackColorExpr})`;
}

function ruleToDaxCondition(valueExpr: string, rule: ConditionalRule): string {
  switch (rule.operator) {
    case '>': return `${valueExpr} > ${rule.value}`;
    case '>=': return `${valueExpr} >= ${rule.value}`;
    case '<': return `${valueExpr} < ${rule.value}`;
    case '<=': return `${valueExpr} <= ${rule.value}`;
    case '=': return `${valueExpr} = ${rule.value}`;
    case 'between': return `AND(${valueExpr} >= ${rule.value}, ${valueExpr} <= ${rule.value2 ?? rule.value})`;
    default: return 'FALSE()';
  }
}
