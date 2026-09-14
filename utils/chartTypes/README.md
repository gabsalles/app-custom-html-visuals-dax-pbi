# Como adicionar um tipo de gráfico novo

Este documento existe pra ser seguido **literalmente**, sem conhecimento
extra sobre a implementação interna do DAXILIZER. Se em algum passo você
precisar ir ler `daxGenerator.ts`/`Preview.tsx` por inteiro pra entender o
que fazer, este documento tem um buraco — corrija-o antes de continuar.

Escopo atual (Fase 4): card e donut **não** seguem este padrão — foram
mantidos como estão pra não arriscar código já validado em 4 fases. Isto
aqui é o caminho pra tipos **novos**, começando pela barra.

## Decisões de escopo já resolvidas (leia antes de começar)

A implementação da barra (Fase 4, Etapa 5 — prova de conceito) bateu em 4
perguntas que o contrato original não respondia. Cada uma foi resolvida
com decisão explícita, não descoberta por tentativa e erro. Ficam
registradas aqui pra o **próximo** tipo não precisar redescobri-las do
zero — se uma pergunta abaixo reaparecer, a resposta já existe:

1. **O shape dos dados do seu tipo é responsabilidade sua, não do
   contrato.** `ChartTypeDefinition<TConfig>` é genérico de propósito —
   ele não assume "1 valor" nem "N valores", não assume nenhum campo em
   comum além do que você declarar. A barra escolheu `bars: BarSlice[]`
   (Passo 1) porque fazia sentido pro problema dela (várias categorias
   dentro de 1 gráfico); o próximo tipo pode ter um shape completamente
   diferente. Não existe "shape padrão de gráfico" pra copiar — decida
   pelo que seu tipo realmente representa.

2. **Normalização/escala entre valores é decisão específica do seu tipo,
   não um serviço genérico do contrato.** A barra precisou de auto-escala
   (várias barras no mesmo gráfico, todas relativas à maior) e resolveu
   isso com `MAX()` encadeado (DAX só tem `MAX()` binário) +
   `DIVIDE(cru, max, 0)` pra proteger contra todo mundo zerado — ver
   `daxMax()` em `bar/barChartType.tsx`. Isso não virou (e não devia
   virar) uma função em `visualConstants.ts` ou no contrato: um tipo
   futuro pode não ter noção de "escala relativa" nenhuma (ex.: um único
   valor absoluto), ou pode precisar de uma normalização diferente (por
   percentual do total, por um alvo fixo, etc.). Resolva a matemática
   dentro da pasta do seu tipo; só suba pra um util compartilhado se um
   **segundo** tipo precisar exatamente da mesma fórmula — generalizar a
   partir de uma amostra só (a barra) seria prematuro.

3. **`getConditionalTarget` é intencionalmente estreito — só cobre tipos
   de valor único.** O hook assume 1 `daxValueExpr` / 1 `fallbackColor`
   por instância. Tipos multi-valor (a barra, com N sub-valores possíveis)
   não se encaixam nisso e não devem forçar o encaixe: a barra retorna
   `getConditionalTarget: () => null` e chama `resolveConditionalColor`
   (preview) / `buildConditionalSwitchDax` (DAX) diretamente, uma vez por
   sub-valor, fora do hook. Ver o comentário completo em `contract.ts`
   (acima da interface `ChartTypeDefinition`) — a razão de não generalizar
   o hook pra multi-valor está documentada lá, não repita a discussão
   aqui, só saiba que essa é a saída esperada, não uma gambiarra.

4. **Fiação de estado de nível de app (Passo 9 abaixo) é custo normal de
   adicionar uma feature de topo, não uma falha da arquitetura do
   contrato.** O Passo 6 (registro) garante que a lógica de
   renderização/geração fica isolada numa pasta + 1 linha — isso é o que
   o critério "1 arquivo + 1 ponto de registro" protege. Ele **não**
   promete zero edição em `App.tsx`/`Editor.tsx`/`types.ts` — todo tipo
   novo de gráfico de topo (igual `donuts` já era antes da barra) precisa
   de: um valor novo em `AppTab`, um array de estado + autosave em
   `App.tsx`, os pontos de criação/exclusão/listagem na Camadas, e uma
   seção de edição no `Editor.tsx`. Isso é esperado e documentado no
   Passo 9 — não é sinal de que o contrato vazou lógica de negócio.

## Passo 1 — Defina o tipo de config

Em `types.ts`, crie uma interface própria (ex.: `BarChartConfig`). Não
reaproveite `CardConfig` nem estenda ele — cada tipo tem seu próprio shape,
mesmo que compartilhe nomes de campo por coincidência (`title`,
`accentColor`, etc.).

## Passo 2 — Crie a pasta do tipo

`utils/chartTypes/<seuTipo>/` com pelo menos um arquivo implementando
`ChartTypeDefinition<SeuConfig>` (interface em `./contract.ts`):

```ts
export const barChartType: ChartTypeDefinition<BarChartConfig> = {
  id: 'bar',
  renderPreview: (config, ctx) => { ... },
  generateDax: (config, ctx) => { ... },
  getConditionalTarget: (config) => { ... },
};
```

## Passo 3 — `getConditionalTarget` primeiro, não por último

Decida **antes** de implementar renderização qual é a superfície visual
primária do seu tipo — a coisa que a formatação condicional (Fase 2) vai
colorir. Em card é a accent bar (uma faixa decorativa); numa barra, é
provavelmente o preenchimento da própria barra. Não existe resposta
genérica — é uma decisão de design específica do tipo, deliberada.

```ts
getConditionalTarget: (config) => ({
  daxValueExpr: '_Bar1_Val_Raw', // nome que generateDax vai declarar
  fallbackColor: config.accentColor || '#4f46e5',
}),
```

Se seu tipo não faz sentido ter cor condicional, retorne `null`.

## Passo 4 — `renderPreview` (lado React)

Reaproveite o que já existe, não reinvente:

- **Formatação condicional**: `resolveConditionalColor` de
  `../conditionalFormatting.ts` — mesma função que cards já usam,
  parâmetros (`value`, `rules`, `fallbackColor`) já bate com o que
  `getConditionalTarget` declarou. Pra tipos multi-valor, ver a nota em
  `ChartTypeDefinition.getConditionalTarget` (contract.ts) — chame direto,
  uma vez por sub-valor, não espere um hook do contrato fazer isso por você.
- **Formatação de valor pro display**: `formatTestValue` de
  `../formatTestValue.ts` — aceita `ValueFormatSpec` (mesma interface de
  `buildValueFormatDax`, não exige CardConfig).
- **Constantes visuais** (breakpoints, paddings, etc.): `../visualConstants.ts`
  antes de inventar um número novo — se o que você precisa não existe lá,
  considere se genuinamente é um número novo ou se um já existente serve.

### Armadilhas já descobertas nas fases anteriores (não repita)

- **Truncamento de texto num filho de flex-row exige `min-width: 0`
  explícito** — sem isso, `overflow-hidden`/`text-ellipsis` são declarados
  mas não fazem nada (o item trava na largura do conteúdo). Descoberto na
  Fase 1 item 2.
- **Nunca use `text-overflow: ellipsis` num valor numérico** — um número
  cortado com "..." pode ser lido como um número diferente do real. Prefira
  quebra de linha (`white-space: normal` + `overflow-wrap: break-word`).
  Decisão da Fase 1 (fechamento).
- **CSS var isolada por preocupação** — se seu tipo tem uma cor "base" E uma
  cor condicional que não deve afetar hover/seleção/outros elementos, use
  uma variável CSS própria pra formatação condicional (ex.: `--accent-bar`
  em card, separada de `--accent`), não reaproveite a mesma variável pra
  tudo. Decisão da Fase 2, motivada por um bug real (accent bar mudando a
  cor do anel de progresso sem querer).

## Passo 5 — `generateDax` (lado DAX)

- **Formatação de valor**: `buildValueFormatDax` de `../valueFormatDax.ts`
  — aceita qualquer objeto com `{formatType, decimalPlaces, prefix?,
  suffix?}`, não precisa ser um card.
- **Formatação condicional**: `buildConditionalSwitchDax` de
  `../conditionalFormatting.ts`, usando o `daxValueExpr` que
  `getConditionalTarget` declarou. Retorna `null` sem regras — nesse caso,
  use a cor estática direto, sem gerar `SWITCH()` à toa (custa caracteres
  de orçamento sem necessidade).

### Convenção de concatenação DAX (a parte mais fácil de errar)

O texto retornado em `html` precisa seguir o padrão que `daxGenerator.ts`
já usa em todo lugar: uma string DAX literal só pode conter texto estático;
qualquer valor dinâmico (uma VAR, uma expressão) precisa de uma quebra
`" & (expressão) & "`. Exemplo mínimo:

```ts
html: `"<div style='color: " & (${fillColorExpr}) & ";'>" & ${valueVar} & "</div>" & `
```

Repare: a string **abre** com `"`, **fecha** antes de cada trecho dinâmico,
reabre depois, e o bloco inteiro **termina com `" & `** (pronto pra
concatenar com o próximo item da lista). Isso não é opcional — uma aspa
fora do lugar quebra a medida inteira, sem erro claro em tempo de escrita.

**Como validar isso sem Power BI disponível**: conte aspas duplas no
resultado de `generateDax(...).html` — tem que dar par. Todos os testes de
`daxGenerator.test.ts` fazem essa checagem (`quoteBalance`); copie o
padrão pro teste do seu tipo.

## Passo 6 — Registre

Uma linha em `utils/chartTypes/index.ts`:

```ts
export const chartTypeRegistry: Record<string, ChartTypeDefinition<any>> = {
  bar: barChartType,
};
```

**Nenhuma edição de LÓGICA fora da pasta do seu tipo + esta linha deveria
ser necessária.** Se você se pegar escrevendo formatação, cálculo de cor,
ou geração de DAX específica do seu tipo dentro de `daxGenerator.ts` ou
`Preview.tsx`, pare — ou falta algo reaproveitável no contrato (avise,
isso é um problema da arquitetura, não do seu tipo), ou você está
resolvendo errado. Esses dois arquivos só podem ganhar um branch de
**despacho puro** (`if (tab === 'seuTipo') { chartTypeRegistry.seuTipo.generateDax(...) }`,
sem nenhuma lógica de negócio do tipo dentro do branch — ver decisão 4
acima e o Passo 9 a seguir pra fiação de estado, que **é** esperada fora
desta pasta.

## Passo 7 — Teste

Crie `utils/chartTypes/<seuTipo>/<seuTipo>.test.ts` seguindo o padrão de
`daxGenerator.test.ts`: casos sintéticos reais (chamando as funções de
verdade, nunca uma fórmula copiada à mão), cobrindo pelo menos:

- Estrutura básica gera sem erro, aspas balanceadas.
- Formatação condicional: sem regras (estático, sem `SWITCH`), com regras
  (ordem, limites), equivalência entre `resolveConditionalColor` (JS) e o
  `SWITCH` gerado (mesmo padrão de simulação documentada usado em
  `conditionalFormatting.test.ts`).
- Pelo menos 1 caso de pior caso (texto/valor longo) — não precisa provar
  que fica bonito, precisa provar que não gera DAX quebrado.

Rode `npm test`, `npm run typecheck`, `npm run build` — os três precisam
passar limpos, e os testes **preexistentes** (dos outros tipos) precisam
continuar passando **sem alteração nenhuma neles**. Se você precisou mudar
um teste que não é do seu tipo pra fazer a suíte passar, isso é regressão,
não é seu tipo novo funcionando.

## Passo 8 — Confirme equivalência preview ↔ DAX

Mesmo critério de toda fase anterior: pro mesmo dado de teste, o preview
(React) e a saída DAX real precisam concordar visualmente (cor, valor
formatado, comportamento condicional). Sem Power BI disponível neste
ambiente, a validação é: `resolveConditionalColor` (JS, testado direto) vs.
uma simulação documentada do `SWITCH` equivalente — nunca comparar contra
uma fórmula reimplementada só pro teste.

## Passo 9 — Fiação de estado de nível de app (fora desta pasta, esperado)

Ver decisão de escopo 4, acima: isto é custo normal de feature nova, não
opcional e não uma falha do contrato. Siga o padrão que `donuts` já usa
(e que a barra replicou em Fase 4/Etapa 5) nestes pontos, nesta ordem:

1. **`types.ts`**: adicione seu valor em `AppTab` (união de string).
2. **`App.tsx`**:
   - `useState<SeuConfig[]>` pro array do tipo, inicializado a partir do
     `localStorage` (mesma chave-padrão `pbi-<tipo>`).
   - `useEffect` de autosave pro `localStorage` nessa mesma chave.
   - No cálculo de `items`/`daxCode` (o que decide o que passar pra
     `generateDAX`), estenda o ternário existente pra incluir seu tipo —
     **cuidado**: um ternário binário antigo (`cards ? cards : donuts`)
     trata silenciosamente qualquer valor não previsto como o último
     branch. Ao adicionar um 3º/4º tipo, confirme que virou um
     if/else-if encadeado de verdade, não um `? :` que esconde o caso
     novo dentro do `else` errado (foi exatamente o bug pré-existente que
     a barra expôs em `Editor.tsx` — ver TODO.md item 6).
   - Botão "+" da Camadas: um branch novo criando uma instância default
     do seu tipo (com dados de exemplo, igual aos 3 exemplos da barra).
   - Lista da Camadas: ícone, subtítulo e handler de exclusão específicos
     do seu tipo.
   - Props `seuTipo`/`setSeuTipo` passadas pra `<Preview>` e `<Editor>`.
3. **`components/Preview.tsx`**: prop nova na interface + destructuring;
   estado vazio (`length === 0`) estendido pro novo tipo; branch de
   despacho puro no ternário de render (ver Passo 6) chamando
   `chartTypeRegistry.seuTipo.renderPreview(...)`.
4. **`components/Editor.tsx`**: prop nova na `EditorProps` + destructuring;
   `selectedSeuTipo` via `useMemo` (mesmo padrão de `selectedDonut`);
   `isEditingItem` estendido; `updateSeuTipo` (mesmo padrão de
   `updateDonut`); um painel de edição JSX próprio (título, dimensões,
   tipografia, campos específicos do tipo) — pode ser mínimo numa
   primeira versão, não precisa cobrir toda a superfície do tipo de
   primeira.
5. **`utils/daxGenerator.ts`**: branch de despacho puro (ver Passo 6) nos
   dois loops (geração de VAR e geração de HTML) — se seu tipo precisa
   das duas metades juntas (como `generateDax` retorna `{vars, html}`),
   compute uma vez só antes dos dois loops e reaproveite o resultado nos
   dois lugares (ver `barDaxResults` em `daxGenerator.ts` como exemplo) —
   não chame `generateDax` duas vezes pra "separar" os loops.

Depois disso, rode `npm test`, `npm run typecheck`, `npm run build` de
novo — a fiação de app-level é onde regressões silenciosas em ternários
binários pré-existentes tendem a aparecer (não é lógica do seu tipo
quebrando, é lógica *antiga* de outro tipo sendo exposta pela primeira vez
por um 3º/4º branch). Não é seu bug pra consertar sozinho fora do escopo —
mas se achar um, registre no TODO.md e corrija, mesmo padrão que a barra
seguiu.
