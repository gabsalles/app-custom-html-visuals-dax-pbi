// utils/categoricalDax.ts
//
// Fase 3, etapa 3: isola "pegar a categoria na posição N do ranking" numa
// função própria — decisão explícita do usuário (2026), pra que trocar de
// mecanismo (INDEX() vs RANKX+FILTER) seja uma mudança localizada, não uma
// reescrita espalhada pelos N blocos de slot.
//
// Caminho principal escolhido: INDEX() (Power BI Desktop nov/2022+, fonte:
// dax.guide). Usuário está confirmando compatibilidade com a própria versão
// (ambiente corporativo, TI pode controlar a versão) antes de confirmar
// definitivamente — ver TODO.md se a Opção B precisar entrar em uso.

import { CategoricalSortBy } from '../types';

export interface SlotRankingRefs {
  /** Texto DAX (VAR ...) a injetar antes de usar nameVar/valueVar. */
  daxVars: string;
  /** Nome da VAR com o nome da categoria nesta posição (BLANK() se não existir). */
  nameVar: string;
  /** Nome da VAR com o valor da medida pra essa categoria (BLANK() se não existir). */
  valueVar: string;
}

export interface SlotRankingOptions {
  /** Nome da VAR da tabela categoria+valor já construída (ver buildCategoryTableDax). */
  tableVar: string;
  /** Referência à coluna categórica, ex: "'Produtos'[Categoria]". */
  columnExpr: string;
  /** Referência à coluna de valor dentro da tabela, ex: "[@CatValue]". */
  valueColumnExpr: string;
  sortBy: CategoricalSortBy;
  /** Posição no ranking, 1-based. */
  slotIndex: number;
  /** Prefixo pras VARs geradas, ex: "_C1_Slot1". */
  varPrefix: string;
}

/**
 * Ponto único de troca entre Opção A (INDEX) e Opção B (RANKX+FILTER).
 * Contrato de saída (nameVar/valueVar prontos pra uso, mesma semântica de
 * BLANK() quando a posição N não existe) não muda entre as duas opções —
 * só o corpo desta função precisa mudar se a Opção B for necessária.
 */
export function buildSlotRankingDax(opts: SlotRankingOptions): SlotRankingRefs {
  const rowVar = `${opts.varPrefix}_Row`;
  const nameVar = `${opts.varPrefix}_Name`;
  const valueVar = `${opts.varPrefix}_Value`;

  // ── OPÇÃO A (atual): INDEX() ──────────────────────────────────────────
  const orderExpr = opts.sortBy === 'alpha'
    ? `ORDERBY(${opts.columnExpr}, ASC)`
    : `ORDERBY(${opts.valueColumnExpr}, ${opts.sortBy === 'value_desc' ? 'DESC' : 'ASC'})`;

  const daxVars =
`VAR ${rowVar} = INDEX(${opts.slotIndex}, ${opts.tableVar}, ${orderExpr})
    VAR ${nameVar} = MAXX(${rowVar}, ${opts.columnExpr})
    VAR ${valueVar} = MAXX(${rowVar}, ${opts.valueColumnExpr})
`;

  // ── OPÇÃO B (compatibilidade — se a versão do Power BI não tiver INDEX()):
  // trocar o bloco `daxVars` acima por algo assim, mantendo nameVar/valueVar
  // com o MESMO nome (nada fora desta função precisa mudar):
  //
  // const daxVars =
  // `VAR ${nameVar} = CALCULATE(SELECTEDVALUE(${opts.columnExpr}),
  //     FILTER(${opts.tableVar}, RANKX(${opts.tableVar}, ${opts.valueColumnExpr}, , ${
  //       opts.sortBy === 'value_asc' ? 'ASC' : 'DESC'}) = ${opts.slotIndex}))
  //  VAR ${valueVar} = CALCULATE(MAXX(${opts.tableVar}, ${opts.valueColumnExpr}),
  //     FILTER(${opts.tableVar}, RANKX(${opts.tableVar}, ${opts.valueColumnExpr}, , ${
  //       opts.sortBy === 'value_asc' ? 'ASC' : 'DESC'}) = ${opts.slotIndex}))
  // `;
  // (RANKX não tem um jeito nativo de rankear por ordem alfabética — o caso
  // 'alpha' precisaria de um RANKX auxiliar sobre uma medida de "posição
  // alfabética", mais complexo; registrar como achado extra no TODO.md se
  // a Opção B for adotada.)

  return { daxVars, nameVar, valueVar };
}

/**
 * Tabela compartilhada (categoria + valor da medida) que todos os slots de
 * um mesmo card categórico consultam — construída uma vez só por card.
 */
export function buildCategoryTableDax(opts: {
  varName: string;
  columnExpr: string;
  measureExpr: string;
}): string {
  return `VAR ${opts.varName} = ADDCOLUMNS(VALUES(${opts.columnExpr}), "@CatValue", CALCULATE(${opts.measureExpr}))\n`;
}
