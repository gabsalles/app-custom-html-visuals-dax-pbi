# DAX HTML Card Generator for Power BI

Um construtor visual interativo (WYSIWYG) desenvolvido em React para criar visuais HTML/CSS avançados no Power BI.

Este projeto permite desenhar cartões de KPI (Cards) e gráficos de rosca (Donut Charts) com design moderno (sombras, degradês, animações) e **gera automaticamente a medida DAX** necessária para renderizar o visual usando o visual personalizado "HTML Content" no Power BI.

## Funcionalidades

- **Editor Visual Intuitivo:** Ajuste cores, fontes, bordas, sombras e espaçamentos sem escrever CSS.
- **Geração Automática de DAX:** O app escreve todo o código DAX (HTML + CSS + Lógica) para você.
- **Componentes Suportados:**
  - **KPI Cards:** Com suporte a ícones (Lucide), barras de progresso, e indicadores de tendência (MoM/YoY).
  - **Gráficos:** Donut Charts e Gauges (Semicírculos) totalmente customizáveis via SVG.
- **Layout Responsivo:** Preview em tempo real para Mobile, Tablet e Desktop.
- **Data Binding:** Defina placeholders (ex: `[Total Vendas]`) que serão substituídos pelas suas medidas reais no Power BI.
- **Temas:** Controle global de estilos (Dark/Light mode simulado, cores primárias, arredondamento).
- **Import/Export:** Salve e carregue seus projetos em formato JSON.

## Tecnologias Utilizadas

- **React 19** & **Vite**
- **Tailwind CSS** (Estilização da UI do editor)
- **Lucide React** (Ícones)
- **TypeScript**

## Como rodar localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev

## Como usar no Power BI
1. Desenhe seu visual neste aplicativo.

2. Na aba de Dados, cadastre os nomes das suas medidas (ex: [Total Vendas]).

3. Clique em "Código DAX" e copie o código gerado.

4. No Power BI:

   - Baixe o visual personalizado HTML Content (por Daniel Marsh-Patrick).

   - Crie uma Nova Medida e cole o código.

   - Arraste a medida para o visual HTML Content.

---

_Desenvolvido para agilizar a criação de dashboards de alta fidelidade visual._