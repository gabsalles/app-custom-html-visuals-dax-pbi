# TODO — Pendências registradas

Este arquivo consolida achados/decisões que foram identificados durante o
desenvolvimento mas deliberadamente **não resolvidos** no momento — para não
perder o rastro conforme novas fases forem gerando novos achados.

Cada item tem: origem (quando foi encontrado), descrição, e o que falta pra
ser resolvido.

---

## 1. Checagem visual real no Power BI (Fase 1, item 3)

**Origem**: Fase 1, item 3 (testes de pior caso).

**O que é**: toda a validação dos cenários de pior caso (título longo, valor
longo, 5+ comparativos empilhados, campos vazios, card mínimo) foi feita de
forma **estática** — bundei `daxGenerator.ts` isoladamente com esbuild e
inspecionei o texto/CSS gerado, sem ambiente de browser ou Power BI
disponível nesta sessão. Isso confirma que a estrutura e as regras de
proteção (ellipsis, wrap, overflow) existem no código gerado, mas **não
substitui uma checagem visual real**.

**O que falta**: abrir os cenários testados (ver lista abaixo) dentro do
Power BI real (ou pelo menos num browser rodando a saída HTML/CSS gerada) e
confirmar visualmente que nada corta, sobrepõe ou desloca.

**Cenários a revisar**:
- Título muito longo (~100 caracteres) nas 3 posições de ícone (top/left/right), nos 2 modos (compact/normal)
- Valor numérico muito longo (ex.: `R$ 999.999.999,99`) — confirmar que a quebra de linha (Fase 1, fechamento) fica visualmente aceitável, não só "não corta"
- 5+ comparativos empilhados — confirmar que o clip por `overflow: hidden` do canvas fixo não corta de forma abrupta/feia
- Combinação título longo + `labelColor` customizado (validado estruturalmente, não visualmente)
- **(Novo, fix do gauge — round 2, `aspect-ratio`)** Gauge/velocímetro (geometry: 'semicircle') em vários valores de `chartSize` (30, 60, 90, 100), várias espessuras de `ringThickness`, e principalmente em **cards com proporções bem diferentes** (alto/estreito vs. baixo/largo — esse era exatamente o cenário que expôs o problema original) — confirmar visualmente que o arco ocupa o espaço disponível sem sobra perceptível e que o texto central (`top:50%` relativo ao wrapper, ver `resolveGaugeSemiGeometry` em `gaugeMath.ts`) fica bem posicionado sob o arco. A geometria (viewBox recortado + `aspect-ratio` CSS) foi derivada matematicamente, não calibrada olhando o resultado renderizado.
  - **Risco específico desta rodada**: o fix depende da propriedade CSS `aspect-ratio` sendo respeitada dentro do sandbox HTML do Power BI. Avaliado como baixo risco (Power BI Desktop moderno usa WebView2/Chromium, que suporta `aspect-ratio` desde 2021), mas **não confirmado ao vivo** — se o gauge aparecer distorcido ou não escalar dentro do Power BI real (diferente do preview), esta é a primeira suspeita a descartar.

---

## 2. `CardType: 'ring'` sem UI no Editor

**Origem**: Fase 0.6 → Fix isolado "item 8".

**O que é**: o tipo de card `'ring'` (mini anel de progresso) existe no
type system (`types.ts`), é renderizado em `Preview.tsx` (`renderRing`) e
agora também em `daxGenerator.ts` (paridade preview↔produção corrigida) —
mas **não há nenhum controle na UI do Editor** para um usuário selecionar
esse tipo. Não é criado por nenhum template (`cardTemplates.ts`) nem
reconhecido pelo parser de DAX reverso (`daxParser.ts`).

**Impacto atual**: nenhum — é um recurso funcional mas inacessível. Só
afeta quem editar o JSON exportado manualmente ou construir uma feature
futura que crie esse tipo programaticamente.

**O que falta pra resolver**: adicionar um controle na seção "Formato Base"
do Editor (`components/Editor.tsx`) análogo ao toggle de `'progress'` já
existente, permitindo alternar entre `'simple'` / `'progress'` / `'ring'`.

---

## 3. `ComparisonConfig.labelColor` sem UI no Editor

**Origem**: Fase 1, item 4.

**O que é**: mesmo padrão do item 2 acima — `labelColor` (cor fixa
opcional pro badge/rótulo de um comparativo, modo `displayMode: 'custom'`)
existe no type system e agora tem paridade completa entre `Preview.tsx` e
`daxGenerator.ts`, mas **não há campo na UI do Editor** para defini-lo.

**Impacto atual**: nenhum — mesma situação do item 2.

**O que falta pra resolver**: adicionar um color picker (reaproveitar
`ColorPickerSimple`, já usado em vários lugares do Editor) na seção de
edição de comparativos, visível quando `displayMode === 'custom'`.

---

## 4. `ConditionalRule` assume que a medida é numérica

**Origem**: Fase 2 (formatação condicional), levantado pelo usuário depois
da implementação inicial.

**O que é**: as regras (`>`, `>=`, `<`, `<=`, `=`, `between`) comparam
`_C{ci}_Val_Raw` diretamente como número, nos dois lados (`resolveConditionalColor`
em JS, `buildConditionalSwitchDax` em DAX). Isso pressupõe que a medida
principal do card sempre resolve pra um número. Se um usuário apontar
`measurePlaceholder` pra uma medida DAX que retorna **texto** (ex.: um status
tipo "Ativo"/"Inativo"), as regras não têm como funcionar de forma
significativa — em DAX, comparar texto com `>`/`<` numérico tende a gerar
erro de conversão de tipo; no preview, `testValues` já é `Record<string,
number>`, então nem dá pra simular esse caso hoje.

**Impacto atual**: baixo — o sistema de cards como um todo já é desenhado
em torno de métricas numéricas (título + valor + comparativos com trend),
então medidas de texto puro não são um caso de uso já suportado em outro
lugar do app. Não é uma regressão introduzida pela Fase 2, é um limite de
escopo que a Fase 2 herdou e não expandiu.

**O que falta pra resolver** (se algum dia for prioridade): operadores de
igualdade/contém para texto (`equals`, `contains`) na `ConditionalRule`,
mais a UI do Editor pra alternar entre modo "numérico" e "texto" na regra.
Fora de escopo da Fase 2 original (que já era explicitamente "thresholds
baseados em valor").

---

## 5. Custo por caractere do orçamento DAX (Fase 3) foi medido, não é constante

**Origem**: Fase 3 (cards agregados), decisão de N padrão e teto de
caracteres.

**O que é**: `DAX_CHAR_HARD_LIMIT` e `DAX_CHAR_SAFE_BUDGET`
(`utils/visualConstants.ts`) são baseados num teto histórico conhecido de
~32.000 caracteres (referência, não confirmada contra documentação atual —
sem acesso a isso neste ambiente offline). Já os números de "custo por
card" usados pra calibrar N=10 como padrão (medidos empiricamente, não
estimados) foram tirados do motor de geração **como ele existe hoje**:

- Card simples (ícone+título+valor): ~1.950 caracteres/slot
- Card rico (2 comparativos + 2 regras condicionais): ~4.446 caracteres/slot
- CSS/wrapper fixo: ~7.226 caracteres (pago uma vez, não por card)

**Atualização (Fase 3, etapa 3 — motor categórico implementado)**: os números
acima eram estimativa baseada em "N cards ricos configurados manualmente" —
o motor categórico real que foi implementado é **bem mais barato**, porque
nunca tem comparativos e reaproveita a tabela de categorias (`_C{ci}_CatTable`)
uma vez só, em vez de duplicar setup por slot:

- N=10 com formatação condicional: 22.032 caracteres totais (~1.480/slot marginal)
- N=10 sem formatação condicional: 20.704 caracteres totais
- N=5 com formatação condicional: 16.036 caracteres totais

Ou seja: **N=10 com condicional fica dentro do budget de segurança (24.000)**,
diferente da estimativa original (que projetava estouro do teto hard pra
cards ricos). O indicador de orçamento no Editor mede isso corretamente e ao
vivo — este número aqui é só contexto histórico de como N=10 foi calibrado.

**Por que isso pode mudar**: a Fase 4 (arquitetura extensível pra novos
tipos de gráfico) vai mexer na estrutura de geração de CSS/HTML
compartilhada. Se isso mudar o tamanho do boilerplate por card (pra mais ou
pra menos), os números acima ficam desatualizados — o indicador de
orçamento (`getGeneratedDaxLength`) sempre vai medir o valor real e
correto, então a **ferramenta continua confiável automaticamente**; o que
fica desatualizado é só a análise humana que levou ao N=10 default.

**O que falta pra resolver**: nada tecnicamente — é só um lembrete pra
re-avaliar se N=10 ainda é um bom padrão depois que a Fase 4 mexer no motor
de geração, já que a base do cálculo pode ter mudado.

---

## 6. `tsconfig.json` não usa `strict: true` — "typecheck limpo" é sob config permissiva

**Origem**: Fase 4, Etapa 2/3 — descoberto ao rodar `npm run typecheck` no
projeto inteiro pela primeira vez (o `npm run build` nunca validou tipo de
verdade, só remove tipos via esbuild sem checar).

**O que é**: `tsc --noEmit` roda zero erros hoje, mas o `tsconfig.json` não
tem `"strict": true` — sem strict null checks, sem checagem estrita de
função, etc. "Zero erros" é uma confirmação real (typecheck genuinamente
roda e passa), mas sob uma barra mais permissiva do que o TypeScript
consegue oferecer.

**Por que importa mais agora**: o contrato genérico criado na Etapa 2
(`ChartTypeDefinition<TConfig>` em `utils/chartTypes/contract.ts`) é
exatamente o tipo de código onde tipagem fraca tende a esconder problema —
genéricos e `any` (o registry hoje é `Record<string, ChartTypeDefinition<any>>`)
passam despercebidos mais fácil sob config não-estrita do que erro num
componente concreto.

**Impacto atual**: nenhum problema concreto identificado — é um risco
estrutural, não um bug encontrado.

**ATUALIZAÇÃO (Fase 4, Etapa 5 — deixou de ser risco teórico)**: ao
implementar a barra, `setActiveAppTab('charts')` (um argumento fora do
union `AppTab`) não gerou erro nenhum — motivo real, mais fundamental do
que "sem strict": **`@types/react`/`@types/react-dom` nunca estiveram
instalados neste projeto** (não estavam no `package.json`, não existiam em
`node_modules/@types/`). Sem eles, `React.FC`, `JSX.Element`,
`ReactElement` e qualquer tipo ligado a props/estado de componente vinham
resolvendo pra `any` silenciosamente — ou seja, **todo `npm run typecheck`
"limpo" reportado nesta conversa, desde que o script foi criado, nunca
checou tipo de verdade em nada que toca React** (só os `utils/*.ts` puros,
que não dependem desses tipos).

Instalados `@types/react@^19`/`@types/react-dom@^19` — isso revelou (e já
corrigidos, não é mais pendência) 3 bugs pré-existentes, nenhum introduzido
nesta fase:
- `components/Editor.tsx`: botão "Gráficos" chamava `setActiveAppTab('charts')`
  (valor que nunca existiu em `AppTab`) — ficava mascarado pelo padrão
  binário antigo (`activeAppTab === 'cards' ? cards : donuts`, que tratava
  qualquer valor ≠ 'cards' como donuts). Os novos ternários de 3 vias da
  barra (`? cards : ? donuts : bars`) teriam exposto isso como regressão
  real — corrigido pra `'donuts'` antes de continuar.
- `App.tsx`: `useRef<ReturnType<typeof setTimeout>>()` sem argumento — React
  19 exige `| undefined` explícito ou um valor inicial.
- `utils/daxParser.ts`: `match` inferido como `never` num `.forEach` —
  anotação de tipo explícita resolveu.

`npm test` (118) + `npm run typecheck` + `npm run build` — todos limpos
depois das correções.

**O que falta pra resolver**: o item original (`strict: true`) continua em
aberto, mas agora com uma base de verdade — o typecheck finalmente checa
React de verdade. Avaliar `strict: true` continua sendo trabalho separado,
não misturado com a barra.

---

## 7. `BarSlice.value` existe no type mas não é lido em lugar nenhum

**Origem**: Fase 4, Etapa 5 (implementação da barra), achado ao revisar
`barChartType.tsx` depois de fechar a fiação de app-level no Editor.

**O que é**: `BarSlice.value: string` (`types.ts`) foi criado espelhando
`DonutSlice.value` (mesmo padrão), mas o preview da barra
(`barChartType.tsx`, `renderPreview`) nunca lê `bar.value` — ele usa
exclusivamente `ctx.testValues[`${config.id}_bar_${i}`]`. O campo existe,
a UI do Editor não escreve nele (escreve em `testValues`, como os outros
tipos), e nada quebra — é só um campo do type que ficou sem função.

**Impacto atual**: nenhum — não é lido, não é escrito, não causa bug.

**O que falta pra resolver**: decidir se `value` sai do `BarSlice` (não
precisa existir) ou se algum dia vira o "valor default" antes de
`testValues` ter uma entrada — não decidido, não é bloqueio pra nada hoje.

---

## Fase 4, Etapa 5 — conclusão (prova de conceito da barra)

**Status**: implementação completa e fechada. `npm test` (124, 6 novos
cobrindo o despacho `tab === 'bars'` em `daxGenerator.ts` ponta-a-ponta) +
`npm run typecheck` + `npm run build` — todos limpos.

**Resposta à pergunta em aberto ("seguiu o README do início ao fim sem
precisar sair dele, ou encontrou algum ponto cego?")**: não seguiu do
início ao fim sem sair — 4 pontos cegos apareceram e cada um foi resolvido
com decisão explícita do usuário antes de continuar, nunca resolvido por
conta própria:

1. Shape dos dados da barra (múltiplos valores por card, não coberto pelo
   contrato original de valor único) — resolvido: Opção B (várias barras
   num gráfico só, array `BarSlice[]`, mesmo padrão de `DonutSlice[]`).
2. Estratégia de normalização/escala entre barras — resolvido: Opção 1
   (auto-escala pela maior barra via `MAX()` encadeado, proteção
   `DIVIDE(...,...,0)` contra todas zeradas).
3. `ChartTypeDefinition.getConditionalTarget` não cobre tipos multi-valor
   — resolvido: Opção (b) (barra retorna `null` e chama
   `resolveConditionalColor`/`buildConditionalSwitchDax` diretamente por
   barra, sem generalizar o hook a partir de uma amostra só — comentário
   registrado em `contract.ts`).
4. O critério "1 arquivo + 1 ponto de registro" não cobria fiação de
   estado de nível de app (array em `App.tsx`, aba, seção no `Editor.tsx`)
   — resolvido: clarificação por escrito em `contract.ts` (o critério
   protege só a lógica de renderização/geração; app-level wiring segue o
   padrão que `donuts` já usa).

**Confirmação de despacho puro (condição fechada pelo usuário — não só
afirmada, evidência abaixo)**: em `components/Preview.tsx`, o branch
`activeAppTab === 'bars'` chama só `chartTypeRegistry.bar.renderPreview(...)`;
em `utils/daxGenerator.ts`, o branch `tab === 'bars'` chama só
`chartTypeRegistry.bar.generateDax(...)` (pré-computado em
`barDaxResults`, usado nos dois loops — VAR e HTML — via
`barDaxResults.forEach(r => dax += r.vars / r.html)`). Nenhum dos dois
arquivos contém lógica de formatação, cor condicional, cálculo de
percentual ou geração de DAX específica de barra — só despacho +
concatenação de string.

**Achado extra sem impacto**: item 7 acima (`BarSlice.value` não usado).

---

## 8. Badge de comparativo em valor exatamente 0 diverge entre preview e produção

**Origem**: consistency-checker (TypeSafe/Jev, `scripts/consistency-check/`)
construído nesta sessão, na primeira rodada real comparando `Preview.tsx`
x `daxGenerator.ts`.

**O que é**: `daxGenerator.ts` (região `comparisonTrend`) calcula
`_C{ci}_Comp{cpi}_Log = _C{ci}_Comp{cpi}_Val_Raw > 0`. No DAX gerado,
`IF(_Log, corPositiva/ícone-up, corNegativa/ícone-down)` — em exatamente
0, `_Log` é `false`, então produção mostra o badge **negativo** ("down").
Já em `Preview.tsx` (`resolveComp`): `trend = tv > 0 ? 'up' : tv < 0 ?
'down' : 'none'` — em exatamente 0, `trend = 'none'`, e a linha do
comparativo inteira é **ocultada** (`resolved.trend !== 'none' &&
renderComparison(...)`).

**Impacto atual**: uma medida de comparativo que resolve pra exatamente
0% não aparece no preview do editor, mas aparece como badge negativo no
visual exportado (Power BI). Divergência visual real entre o que o
usuário configura e o que é entregue.

**O que falta pra resolver**: decidir qual dos dois comportamentos é o
correto (provavelmente um estado "neutro" explícito nos dois lados, não
apenas "esconde" ou "trata como negativo") e alinhar `Preview.tsx` e
`daxGenerator.ts`.

---

## 9. Sort do gráfico de barras quebra sob locale de vírgula decimal

**Origem**: code-review (2 passes) antes do merge de
`feature/bar-chart-categorico`.

**O que é**: `utils/chartTypes/bar/barChartType.tsx` (~linha 152) — o
script de ordenação client-side no HTML exportado faz `parseFloat` no
atributo `data-value`, que vem de `FORMAT(_RowValorRaw,
"0.##############")` no DAX. `FORMAT()` usa o separador decimal do
locale do relatório/modelo do Power BI — em pt-BR isso é vírgula.
`parseFloat('1234,5')` retorna `1234` (trunca no separador), então
valores não-inteiros diferentes podem colapsar pro mesmo número.

**Impacto atual**: o botão interativo "Ordenar" no visual HTML exportado
(produção, não só preview) pode ordenar errado ou de forma instável
quando o relatório usa locale de vírgula decimal e as medidas não são
inteiras — bem provável dado que este app é 100% pt-BR.

**O que falta pra resolver**: usar um valor sem formatação de locale (ex.:
o número bruto, ou `FORMAT` com uma cultura fixa) pro `data-value`,
reservando `FORMAT` só pro texto exibido ao usuário.

---

## 10. `sortDir` do preview de barra categórica não resincroniza com a config

**Origem**: code-review (2 passes) antes do merge de
`feature/bar-chart-categorico`.

**O que é**: `utils/chartTypes/bar/barChartType.tsx` (~linha 198) —
`CategoricalBarPreview` inicializa `sortDir` uma única vez via `useState`
a partir de `cat.sortBy`, sem nenhum `useEffect` de resync. Mudar o
dropdown "Ordenação" no Editor depois do componente já montado não
atualiza a ordem exibida no preview.

**Impacto atual**: só afeta o preview do editor (não o visual exportado)
— o usuário muda a configuração, mas o preview continua mostrando a
ordem antiga até interagir manualmente com o botão de toggle ou o
componente remontar.

**O que falta pra resolver**: adicionar um `useEffect` que resincroniza
`sortDir` quando `cat.sortBy` muda.

---

## 11. Controles de Tipografia (Valor/Rótulo) sem efeito no motor categórico de barras

**Origem**: code-review (2 passes) antes do merge de
`feature/bar-chart-categorico`.

**O que é**: `components/Editor.tsx` (~linha 1165) — o painel
"Tipografia" do gráfico de barras ainda expõe controles de tamanho de
fonte de Valor (`fontSizeValue`) e Rótulo (`fontSizeLabel`), mas o motor
categórico novo (`generateCategoricalBarDax` e `CategoricalBarPreview`,
ambos em `barChartType.tsx`) nunca lê esses dois campos — só
`fontSizeTitle` é usado, e só no cabeçalho do preview.

**Impacto atual**: regressão de UX (não de dados) — no modo manual antigo
esses controles funcionavam de verdade; agora mudam a configuração salva
mas nada no preview/DAX muda. Confuso pro usuário, não quebra nada.

**O que falta pra resolver**: decidir entre (a) fazer o motor categórico
realmente ler `fontSizeValue`/`fontSizeLabel` nos lugares certos, ou (b)
remover esses dois controles do painel quando o tipo ativo é bar chart
categórico.

---

## 12. `RANKX` alfabético sem garantia formal de ordem no gráfico de barras (orientação "ranking")

**Origem**: code-review (2 passes) antes do merge de
`feature/bar-chart-categorico`.

**O que é**: `utils/chartTypes/bar/barChartType.tsx` (~linha 92) — para
orientação `'ranking'` combinada com `sortBy: 'alpha'`, o número do badge
de rank vem de `RANKX(topVar, columnExpr, , orderDir, DENSE)` ranqueando
uma coluna de texto. O próprio comentário do autor no código já reconhece
que não há garantia formal do DAX de que `RANKX` produz uma posição
alfabética bem definida sobre texto.

**Impacto atual**: baixa probabilidade — só afeta gráficos de barra em
orientação "ranking" + sort alfabético + nomes de categoria com
acentos/case misto, onde a semântica de comparação de texto do `RANKX`
pode diferir da ordenação usada para montar a lista de linhas (`TOPN`),
gerando badges de rank que não combinam visualmente com a ordem exibida.

**O que falta pra resolver**: validar empiricamente no Power BI real se
`RANKX(<coluna texto>, ..., DENSE)` bate com a ordem do `TOPN` usado para
a lista, ou trocar a fonte do número do badge para um índice sequencial
calculado a partir da própria lista já ordenada, em vez de um `RANKX`
independente.

---

## Convenção deste arquivo

- Novo achado registrado aqui: adicionar seção nova, com origem clara
  (qual fase/item o encontrou).
- Item resolvido: remover a seção (o histórico já fica no git log/commits,
  não precisa manter riscado aqui).
- Isto **não é** um backlog de features novas — é especificamente pra
  divergências/gaps encontrados durante o trabalho de consistência
  preview↔produção, que foram conscientemente adiados.
