// utils/valueFormatDax.ts
//
// Fase 4, Etapa 3: extraído de dentro de daxGenerator.ts (era uma função
// local, presa no closure de generateDAX(), inacessível a qualquer coisa
// fora dali). Generalizado pra não depender de CardConfig inteiro — só dos
// 4 campos que a formatação de valor realmente usa — assim um tipo de
// gráfico novo (ex: barra) reaproveita isso sem precisar "se parecer" com
// um card. CardConfig continua satisfazendo esta interface estruturalmente,
// então os call-sites existentes em daxGenerator.ts não mudam.

import { FormatType } from '../types';

export interface ValueFormatSpec {
  formatType: FormatType;
  decimalPlaces: number;
  prefix?: string;
  suffix?: string;
}

export function getFormatString(type: string, decimals: number): string {
  const zeros = decimals > 0 ? "." + "0".repeat(decimals) : "";
  switch (type) {
    case 'integer': return "#,##0";
    case 'decimal': return `#,##0${zeros}`;
    case 'currency': return `#,##0${zeros}`;
    case 'percent': return `0${zeros}%`;
    default: return "";
  }
}

/**
 * Gera as VARs de formatação de um valor bruto (rawVarExpr) — mesma lógica
 * usada tanto pelo _C{ci}_Val de um card quanto por cada slot de um grupo
 * categórico (Fase 3). outVarPrefix nomeia as VARs intermediárias geradas.
 */
export function buildValueFormatDax(
  rawVarExpr: string,
  outVarPrefix: string,
  spec: ValueFormatSpec
): { dax: string; valVar: string } {
  const valVar = `${outVarPrefix}_Val`;
  let dax = '';
  if (spec.formatType === 'none') {
    dax = `VAR ${valVar} = "${spec.prefix || ''}" & ${rawVarExpr} & "${spec.suffix || ''}"\n`;
  } else if (spec.formatType === 'short' || spec.formatType === 'currency_short') {
    const zeros = spec.decimalPlaces > 0 ? "." + "0".repeat(spec.decimalPlaces) : "";
    const shortFmt = `#,0${zeros}`;
    const baseFmt = `#,##0${zeros}`;
    const prefix = spec.formatType === 'currency_short' ? "R$ " : (spec.prefix || "");
    const absVar = `${outVarPrefix}_Abs`;
    const dynVar = `${outVarPrefix}_Dyn`;
    dax += `VAR ${absVar} = ABS(${rawVarExpr})\n`;
    dax += `VAR ${dynVar} = SWITCH(TRUE(), ${absVar} >= 1000000000, FORMAT(DIVIDE(${rawVarExpr}, 1000000000), "${shortFmt}") & " B", ${absVar} >= 1000000, FORMAT(DIVIDE(${rawVarExpr}, 1000000), "${shortFmt}") & " M", ${absVar} >= 1000, FORMAT(DIVIDE(${rawVarExpr}, 1000), "${shortFmt}") & " K", FORMAT(${rawVarExpr}, "${baseFmt}"))\n`;
    dax += `VAR ${valVar} = "${prefix}" & ${dynVar} & "${spec.suffix || ''}"\n`;
  } else {
    const formatStr = getFormatString(spec.formatType, spec.decimalPlaces);
    const explicitPrefix = spec.formatType === 'currency' ? (spec.prefix || "R$ ") : (spec.prefix || "");
    dax = `VAR ${valVar} = "${explicitPrefix}" & FORMAT(${rawVarExpr}, "${formatStr}") & "${spec.suffix || ''}"\n`;
  }
  return { dax, valVar };
}
