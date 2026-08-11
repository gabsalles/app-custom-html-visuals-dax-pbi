import { TutorialStep } from '../components/OnboardingTutorial';

/**
 * Tutorial steps - COMPREHENSIVE PATH with UX best practices
 * v0.5.0 - Full guided experience
 *
 * UX Principles Applied:
 * ✓ Clear progression (1/11, 2/11, etc)
 * ✓ Orientation in space (where to look)
 * ✓ Progressive disclosure (learn one thing at a time)
 * ✓ Feedback (what just happened)
 * ✓ Clear CTAs (what to do next)
 * ✓ Hints (why you're doing this)
 * ✓ Confirmation (success states)
 * ✓ Ability to undo (don't be afraid to try)
 * ✓ Encouragement (you're doing great!)
 * ✓ Clear payoff (here's the result)
 */
export interface TutorialStepExtended extends TutorialStep {
  autoAction?: () => void;
  ctaText?: string;
  ctaAction?: () => void;
  hint?: string;
  feedback?: string; // What happened after this step
}

export const TUTORIAL_STEPS: TutorialStepExtended[] = [
  {
    id: 'welcome',
    title: '🎓 Bem-vindo ao DAXILIZER!',
    description:
      'Você está prestes a criar seu primeiro card visual profissional para Power BI. Este tutorial vai guiar você em 10 passos simples.\n\n⏱️ Tempo estimado: 5 minutos\n\nVamos começar?',
    action: 'Clique em "Começar" para iniciar a jornada',
    ctaText: 'Começar 🚀',
  },

  {
    id: 'interface-overview',
    title: '🏠 Conheça a interface',
    description:
      'O DAXILIZER tem 3 painéis principais:\n\n📍 ESQUERDA: "Camadas" - Lista de todos os cards\n📍 CENTRO: "Preview" - Visualização do dashboard\n📍 DIREITA: "Editor" - Configurações e customização\n\nCada passo vai usar um desses painéis. Vamos explorar!',
    action: 'Observe os 3 painéis na tela',
    hint: 'Você pode minimizar/maximizar cada painel conforme necessário',
    feedback: 'Perfeito! Agora você sabe onde tudo está 👍',
  },

  {
    id: 'layers-panel-intro',
    title: '📋 O painel "Camadas" (Esquerda)',
    description:
      'Este painel mostra todos os cards do seu dashboard. É aqui que você:\n\n✏️ Cria novos cards (botão "+")\n👁️ Seleciona um card para editar\n📋 Vê a lista de todos os elementos\n\nVamos criar seu primeiro card aqui!',
    targetElement: '[data-tutorial="layers-panel"]',
    action: 'Veja o botão "+" no topo do painel esquerdo',
    hint: 'O botão "+" está ao lado de "CAMADAS"',
    feedback: 'Ótimo! Você identificou aonde criar novos cards',
  },

  {
    id: 'create-card-button',
    title: '➕ Crie um novo card',
    description:
      'Vamos clicar no botão "+" para abrir a galeria de templates!\n\nEste botão é a porta de entrada para criar qualquer novo card. Após clicar, você verá 5 templates profissionais prontos para usar.',
    targetElement: '[data-tutorial="create-card-button"]',
    action: 'Clique no botão "+" agora',
    ctaText: '👆 Abrir galeria de templates',
    ctaAction: () => {
      const btn = document.querySelector('[data-tutorial="create-card-button"]') as HTMLElement;
      btn?.click();
    },
    feedback: 'Excelente! A galeria de templates está aberta',
    hint: 'A galeria deve aparecer no centro da tela',
  },

  {
    id: 'template-selection',
    title: '🎨 Escolha um template',
    description:
      'A galeria de templates está mostrando 5 opções profissionais:\n\n📊 Simple KPI - Métrica básica com trending\n⬆️ Growth YoY - Comparação anual + mensal\n⭐ Rating - Para scores/avaliações\n🎯 Progress - Para metas e objetivos\n✅ Status - Para indicadores sim/não\n\nCada um vem pré-configurado com as melhores práticas. Escolha um para começar!',
    targetElement: '[data-tutorial="template-gallery"]',
    action: 'Selecione o template "📊 Simple KPI"',
    ctaText: '📊 Usar Simple KPI',
    ctaAction: () => {
      // Clica no primeiro template (Simple KPI)
      const templates = document.querySelectorAll('[data-tutorial="template-gallery"] button');
      if (templates.length > 0) {
        (templates[0] as HTMLElement).click();
      }
    },
    feedback: '🎉 Seu card foi criado com a configuração do template!',
    hint: 'Se preferir outro template, pode escolher - todos funcionam igual!',
  },

  {
    id: 'card-created-confirmation',
    title: '✅ Card criado com sucesso!',
    description:
      'Perfeito! Um novo card foi criado e já está visível:\n\n✅ Na lista de "Camadas" (esquerda)\n✅ No preview (centro)\n✅ No editor (direita)\n\nAgora vamos customizar este card para deixar com a sua cara. O painel direito é onde toda a mágica acontece!',
    targetElement: '[data-tutorial="right-panel"]',
    action: 'Veja o painel "Editor" no lado direito',
    feedback: 'Você tem um card funcional pronto para customizar!',
    hint: 'O painel direito tem abas: Dados, Layout, Fontes, Cores, Efeitos',
  },

  {
    id: 'customize-title',
    title: '✏️ Customize o título do card',
    description:
      'Vamos começar a customizar! O primeiro passo é dar um nome significativo ao seu card.\n\nVocê verá um campo de texto no topo do editor direito onde está escrito "Novo Card". Mude para algo como:\n\n💰 "Receita Mensal"\n📊 "Total de Vendas"\n👥 "Quantidade de Clientes"\n\nUse um nome que descreva a métrica!',
    targetElement: '[data-tutorial="right-panel"]',
    position: 'left',
    action: 'Encontre o campo "Título" e mude o nome',
    ctaText: 'Entendi 👍',
    feedback: 'Ótimo! Seu card agora tem um nome significativo',
    hint: 'O título aparece também no preview (centro)',
  },

  {
    id: 'customize-icon',
    title: '🎨 Escolha um ícone representativo',
    description:
      'O ícone é super importante para comunicar visualmente. Na seção "Iconografia" você pode:\n\n📍 Escolher entre 30+ ícones\n📍 Categorizar por tipo (finanças, pessoas, etc)\n📍 Ver preview em tempo real\n\nProcure um ícone que represente sua métrica. Ex: 💰 para dinheiro, 📈 para crescimento, etc.',
    targetElement: '[data-tutorial="right-panel"]',
    position: 'left',
    action: 'Clique em "TROCAR" na seção Iconografia',
    feedback: 'Lindo! O ícone deixa o card mais comunicativo',
    hint: 'O ícone aparece grande no preview - escolha um que você goste!',
  },

  {
    id: 'customize-measure',
    title: '📊 Configure a medida principal',
    description:
      'Agora vamos dizer ao card qual é a informação principal que ele deve mostrar.\n\nNa seção "Dados & Formatação" você:\n\n1️⃣ Escolhe a "Medida Principal (DAX)" - é o número que vai aparecer grande\n2️⃣ Escolhe o "Formato" - como exibir (moeda, porcentagem, etc)\n3️⃣ Configura "Decimais" - quantas casas decimais mostrar\n\nEste é o "coração" do seu card!',
    targetElement: '[data-tutorial="right-panel"]',
    position: 'left',
    action: 'Clique em "Medida Principal (DAX)" e escolha uma métrica',
    feedback: '🎯 Agora seu card sabe qual número mostrar!',
    hint: 'Você verá um preview atualizado em tempo real no centro',
  },

  {
    id: 'preview-result',
    title: '👁️ Veja o resultado em tempo real',
    description:
      'Tudo o que você configurar aparece INSTANTANEAMENTE no preview (centro da tela)!\n\nVocê tem:\n\n✨ Título customizado\n🎨 Ícone escolhido\n📊 Número principal\n🎨 Cores do template\n\nSeeu card não está assim, volte e ajuste no editor (direita). Tudo é reversível!',
    targetElement: '[data-tutorial="layers-panel"]',
    position: 'right',
    action: 'Olhe para o centro da tela e veja seu card pronto',
    feedback: 'Você criou um card profissional em minutos! 🎉',
    hint: 'Pode continuar customizando: cores, comparativos, efeitos - tudo é possível',
  },

  {
    id: 'copy-paste-feature',
    title: '📋 Duplicate rápido com Copy/Paste',
    description:
      'Se você precisar criar múltiplos cards similares, existe um atalho:\n\n1️⃣ Hover no card na lista (esquerda) - aparecem botões\n2️⃣ Clique em [👆 Copy] - copia toda a configuração\n3️⃣ Vá para outro card\n4️⃣ Clique em [📌 Paste] - aplica a configuração\n\nEconomiza MUITO tempo quando você tem 20+ cards! ⏱️',
    targetElement: '[data-tutorial="layers-panel"]',
    position: 'right',
    action: 'Você verá botões Copy/Paste ao passar mouse',
    feedback: 'Você aprendeu o truque dos profissionais! 🚀',
    hint: 'Copy/Paste copia tudo MENOS a medida - cada card fica único',
  },

  {
    id: 'export-dax',
    title: '💾 Exporte para o Power BI',
    description:
      'A melhor parte: levar seu card para o Power BI!\n\nPROCESSO:\n1️⃣ Clique na aba "DAX" (lado direito)\n2️⃣ O código completo será gerado automaticamente\n3️⃣ Copie tudo (Ctrl+A, Ctrl+C)\n4️⃣ Vá no Power BI e cole em um Visual Script\n5️⃣ Pronto! Seu card visual funciona perfeitamente\n\nO código inclui TODAS as suas customizações automaticamente!',
    targetElement: '[data-tutorial="export-dax-button"]',
    position: 'bottom',
    action: 'Clique na aba "DAX" para ver o código gerado',
    ctaText: '📋 Mostrar código DAX',
    ctaAction: () => {
      const btn = document.querySelector('[data-tutorial="export-dax-button"]') as HTMLElement;
      btn?.click();
    },
    feedback: 'Seu card está pronto para o Power BI! 🚀',
    hint: 'Você pode copiar e fazer upload quantas vezes quiser',
  },

  {
    id: 'completion',
    title: '🎊 Parabéns! Você domina o DAXILIZER!',
    description:
      'Excelente trabalho! 🏆\n\nVocê aprendeu:\n\n✅ Criar cards com templates profissionais\n✅ Customizar título, ícone, medidas\n✅ Ver preview em tempo real\n✅ Duplicar com Copy/Paste\n✅ Exportar DAX para Power BI\n\nAgora você pode:\n\n🎨 Criar quantos cards quiser\n🎯 Experimentar diferentes templates\n⚡ Trabalhar muito mais rápido com Copy/Paste\n🚀 Levar seus cards pro Power BI\n\nQualquer dúvida, este tutorial está sempre disponível. Divirta-se criando! 🎉',
    action: 'Você está pronto para criar dashboards profissionais!',
    ctaText: 'Finalizar e começar 🚀',
    feedback: 'Bem-vindo à comunidade DAXILIZER! 👋',
  },
];

/**
 * Check if user has completed tutorial
 */
export const isTutorialCompleted = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('daxilizer-tutorial-completed') === 'true';
};

/**
 * Mark tutorial as completed
 */
export const markTutorialCompleted = (): void => {
  localStorage.setItem('daxilizer-tutorial-completed', 'true');
};

/**
 * Reset tutorial (for testing)
 */
export const resetTutorial = (): void => {
  localStorage.removeItem('daxilizer-tutorial-completed');
};

/**
 * Get current tutorial step (for resuming)
 */
export const getTutorialStep = (): number => {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('daxilizer-tutorial-step');
  return saved ? parseInt(saved, 10) : 0;
};

/**
 * Save current tutorial step
 */
export const saveTutorialStep = (step: number): void => {
  localStorage.setItem('daxilizer-tutorial-step', step.toString());
};
