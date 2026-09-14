import { TutorialStep } from '../components/OnboardingTutorial';

/**
 * Tutorial Steps v2 - Complete Rewrite with Auto-Advance
 *
 * Key Improvements:
 * - Auto-detect when user completes an action
 * - Highlight specific fields (not just panels)
 * - Automatic modal detection and navigation
 * - Smart positioning and detection
 */
export interface TutorialStepV2 extends TutorialStep {
  // What to highlight
  highlightSelector?: string; // Primary element to glow
  highlightSecondary?: string[]; // Additional elements to subtly highlight

  // Auto-advance logic
  autoAdvanceTrigger?: 'click' | 'input' | 'modal' | 'none';
  triggerSelector?: string; // What to watch for changes/clicks
  triggerValue?: string; // For input fields, what value to check for

  // Context hints
  ctaText?: string;
  ctaHidden?: boolean; // Hide auto-CTA, just show explanation
  hint?: string;
  feedback?: string;
}

export const TUTORIAL_STEPS_V2: TutorialStepV2[] = [
  {
    id: 'welcome',
    title: '🎓 Bem-vindo ao DAXILIZER!',
    description:
      'Você está prestes a criar seu primeiro card visual profissional para Power BI em apenas 5 minutos!\n\nEste tutorial vai guiar você passo a passo. Cada ação que você fizer vai ser detectada automaticamente.',
    action: 'Clique em "Próximo" para começar a jornada',
    autoAdvanceTrigger: 'none',
    ctaText: 'Começar 🚀',
  },

  {
    id: 'interface-overview',
    title: '🏠 Conheça a interface em 3 painéis',
    description:
      'O DAXILIZER tem 3 painéis principais:\n\n📍 ESQUERDA: "Camadas" - Lista de cards\n📍 CENTRO: "Preview" - Visualização do dashboard\n📍 DIREITA: "Editor" - Configurações\n\nCada passo vai usar esses painéis. Você pronto?',
    action: 'Observe os 3 painéis na tela',
    autoAdvanceTrigger: 'none',
    ctaText: 'Entendi! Próximo',
    hint: 'Os painéis são redimensionáveis - arraste as bordas se quiser',
  },

  {
    id: 'layers-panel-intro',
    title: '📋 Painel "Camadas" (Esquerda)',
    description:
      'Este é o hub central! Aqui você:\n\n✅ Cria novos cards com o botão "+"\n✅ Vê a lista de todos os elementos\n✅ Seleciona qual card editar\n✅ Usa Copy/Paste para duplicar configurações\n\nVamos criar seu primeiro card!',
    highlightSelector: '[data-tutorial="layers-panel"]',
    action: 'Veja a seção "CAMADAS" à esquerda',
    autoAdvanceTrigger: 'none',
    ctaText: 'Próximo',
  },

  {
    id: 'create-card-button',
    title: '➕ Clique no botão "+" para criar um card',
    description:
      'O botão "+" é a porta de entrada para criar cards!\n\nAo clicar, a galeria de templates vai abrir mostrando 5 opções profissionais prontas para usar.\n\n👉 Clique no botão "+" AGORA.',
    highlightSelector: '[data-tutorial="create-card-button"]',
    action: 'O botão "+" está realçado em ROXO. Clique nele!',
    autoAdvanceTrigger: 'click',
    triggerSelector: '[data-tutorial="create-card-button"]',
    feedback: '✅ Excelente! A galeria de templates está aberta',
    hint: 'A galeria deve aparecer no centro da tela',
    ctaHidden: true,
  },

  {
    id: 'template-selection',
    title: '🎨 Escolha o template "Simple KPI"',
    description:
      'A galeria está mostrando 5 templates profissionais:\n\n📊 Simple KPI - Métrica básica com trending\n⬆️ Growth YoY - Comparação anual\n⭐ Rating - Para scores\n🎯 Progress - Para metas\n✅ Status - Para indicadores\n\n👉 Selecione "📊 Simple KPI" AGORA.',
    highlightSelector: '[data-tutorial="template-gallery"]',
    action: 'Clique no primeiro template (Simple KPI)',
    autoAdvanceTrigger: 'modal',
    triggerSelector: '[data-tutorial="create-card-button"]',
    feedback: '🎉 Card criado com sucesso!',
    hint: 'Cada template vem pré-configurado com as melhores práticas',
    ctaHidden: true,
  },

  {
    id: 'card-confirmation',
    title: '✅ Seu card foi criado!',
    description:
      'Perfeito! Um novo card apareceu:\n\n✅ Na lista "Camadas" (esquerda)\n✅ No preview (centro)\n✅ No editor (direita)\n\nAgora vamos customizar! O painel DIREITO é onde a mágica acontece.',
    highlightSelector: '[data-tutorial="right-panel"]',
    action: 'Observe o painel "Editor" no lado direito',
    autoAdvanceTrigger: 'none',
    ctaText: 'Próximo',
    feedback: 'Você tem um card funcional pronto para customizar!',
  },

  {
    id: 'customize-title',
    title: '✏️ Customize o título do card',
    description:
      'Vamos dar um nome significativo ao seu card!\n\nEncontre o campo de texto no topo do Editor (direita) onde está escrito "Novo Card".\n\n👉 Mude para um nome como: "Receita", "Vendas", "Clientes", etc.',
    // Fix da tela branca (passo 7→8): 'input[value="Novo Card"]' era frágil
    // (só casava por coincidir com o texto padrão) — trocado pelo atributo
    // data-tutorial que components/Editor.tsx já expõe nesse input.
    highlightSelector: '[data-tutorial="title-input"]',
    highlightSecondary: ['[data-tutorial="right-panel"]'],
    action: 'Clique no campo de título e mude o nome',
    autoAdvanceTrigger: 'input',
    triggerSelector: '[data-tutorial="title-input"]',
    triggerValue: 'minLength=3', // Qualquer texto com 3+ caracteres
    feedback: '✨ Ótimo! Seu card tem um nome significativo',
    hint: 'O título aparece também no preview (centro)',
    ctaHidden: true,
  },

  {
    id: 'customize-icon',
    title: '🎨 Escolha um ícone representativo',
    description:
      'O ícone comunica visualmente o que o card é!\n\nNa seção "Iconografia" (meio do Editor direito):\n\n1️⃣ Clique no botão "TROCAR"\n2️⃣ Escolha um ícone (💰 moeda, 📈 trending, etc)\n3️⃣ Clique para confirmar\n\n👉 Escolha um ícone que represente sua métrica!',
    // Fix da tela branca (causa raiz do bug reportado): 'button:has-text(...)'
    // é sintaxe do Playwright, não CSS válido — document.querySelector()
    // lançava SyntaxError sem try/catch, travando a renderização inteira
    // nesta transição de passo. Trocado por um data-tutorial de verdade
    // (adicionado no botão TROCAR em components/Editor.tsx).
    highlightSelector: '[data-tutorial="icon-trocar-button"]',
    highlightSecondary: ['[data-tutorial="right-panel"]'],
    action: 'Procure pela seção "Iconografia" e clique em "TROCAR"',
    autoAdvanceTrigger: 'modal',
    triggerSelector: '[data-tutorial="icon-trocar-button"]',
    feedback: '🎨 Lindo! O ícone deixa o card mais comunicativo',
    hint: 'Você verá o ícone atualizar em tempo real no preview',
    ctaHidden: true,
  },

  {
    id: 'configure-measure',
    title: '📊 Configure a medida principal',
    description:
      'Agora vamos dizer ao card qual é a INFORMAÇÃO PRINCIPAL!\n\nNa seção "Dados & Formatação":\n\n1️⃣ Clique em "Medida Principal (DAX)"\n2️⃣ Escolha uma métrica da lista\n3️⃣ Escolha o "Formato" (moeda, porcentagem, etc)\n\n👉 Isso vai mostrar o número grande no card!',
    // Fix: esse atributo não existia em lugar nenhum até agora (adicionado
    // em MeasureSelect/Editor.tsx) — o destaque nunca aparecia neste passo.
    highlightSelector: '[data-tutorial="measure-select"]',
    highlightSecondary: ['[data-tutorial="right-panel"]'],
    action: 'Selecione uma "Medida Principal" na seção Dados',
    autoAdvanceTrigger: 'none',
    ctaText: 'Próximo - Ver resultado',
    feedback: '🎯 Perfeito! Seu card sabe qual número mostrar',
    hint: 'Você verá o número atualizar no preview (centro)',
  },

  {
    id: 'preview-result',
    title: '👁️ Veja seu card pronto!',
    description:
      'Tudo o que você configurou aparece INSTANTANEAMENTE no preview:\n\n✨ Título customizado\n🎨 Ícone escolhido  \n📊 Número principal\n🎨 Cores do template\n\nSeu card é PROFISSIONAL e foi criado em minutos! 🎉',
    // Fix: a classe real do card no preview é '.p-card' (components/Preview.tsx)
    // — '.preview-card' nunca existiu, o destaque nunca aparecia neste passo.
    highlightSelector: '.p-card',
    action: 'Olhe para o CENTRO da tela e veja seu card pronto',
    autoAdvanceTrigger: 'none',
    ctaText: 'Próximo - Pro Tips',
    feedback: 'Você criou um card profissional em minutos!',
    hint: 'Pode continuar customizando: cores, efeitos, comparativos - tudo é possível',
  },

  {
    id: 'copy-paste-pro-tip',
    title: '⚡ Pro Tip: Copy/Paste para profissionais',
    description:
      'Se você precisar de múltiplos cards similares, existe um ATALHO PROFISSIONAL:\n\n1️⃣ Hover no card na lista (esquerda)\n2️⃣ Clique em [👆 Copy] - copia tudo\n3️⃣ Vá para outro card\n4️⃣ Clique em [📌 Paste] - aplica em 1 segundo\n\nEconomiza MUITO tempo com 20+ cards! ⚡',
    highlightSelector: '[data-tutorial="layers-panel"]',
    action: 'Você verá botões Copy/Paste ao passar mouse',
    autoAdvanceTrigger: 'none',
    ctaText: 'Próximo - Exportar',
    feedback: 'Você aprendeu o truque dos profissionais!',
    hint: 'Copy/Paste copia tudo MENOS a medida - cada card fica único',
  },

  {
    id: 'export-dax',
    title: '🚀 Exporte seu card para Power BI!',
    description:
      'A melhor parte: levar seu card para o Power BI!\n\n1️⃣ Clique na aba "DAX" (lado direito, próximo a "Visual")\n2️⃣ Código completo vai ser gerado automaticamente\n3️⃣ Copie tudo (Ctrl+A, Ctrl+C)\n4️⃣ Vá no Power BI e cole em um Visual Script\n5️⃣ Seu card está vivo! 🚀\n\n👉 O código inclui TODAS as suas customizações!',
    highlightSelector: '[data-tutorial="export-dax-button"]',
    action: 'Clique na aba "DAX" para ver o código gerado',
    autoAdvanceTrigger: 'click',
    triggerSelector: '[data-tutorial="export-dax-button"]',
    feedback: '✅ Seu card está pronto para o Power BI!',
    ctaHidden: true,
  },

  {
    id: 'completion',
    title: '🏆 Parabéns! Você domina o DAXILIZER!',
    description:
      'Excelente trabalho! 🎊\n\nVocê aprendeu:\n\n✅ Criar cards com templates profissionais\n✅ Customizar título, ícone, medidas\n✅ Ver preview em tempo real\n✅ Usar Copy/Paste (pro move)\n✅ Exportar DAX para Power BI\n\nAgora você pode:\n🎨 Criar quantos cards quiser\n⚡ Trabalhar muito mais rápido\n🚀 Levar seus cards pro Power BI\n\nDivirta-se criando dashboards profissionais! 🎉',
    action: 'Você está pronto!',
    autoAdvanceTrigger: 'none',
    ctaText: 'Finalizar e começar 🚀',
    feedback: 'Bem-vindo à comunidade DAXILIZER!',
  },
];

/**
 * Tutorial state management
 */
export const isTutorialCompleted = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('daxilizer-tutorial-completed') === 'true';
};

export const markTutorialCompleted = (): void => {
  localStorage.setItem('daxilizer-tutorial-completed', 'true');
};

export const resetTutorial = (): void => {
  localStorage.removeItem('daxilizer-tutorial-completed');
  localStorage.removeItem('daxilizer-tutorial-step');
};

export const getTutorialStep = (): number => {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('daxilizer-tutorial-step');
  return saved ? parseInt(saved, 10) : 0;
};

export const saveTutorialStep = (step: number): void => {
  localStorage.setItem('daxilizer-tutorial-step', step.toString());
};
