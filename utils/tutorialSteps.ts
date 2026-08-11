import { TutorialStep } from '../components/OnboardingTutorial';

/**
 * Tutorial steps configuration for Fase 4
 * v0.5.0 - Interactive onboarding guide
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🎓 Bem-vindo ao DAXILIZER!',
    description:
      'Criaremos juntos seu primeiro card visual profissional para Power BI. Este tutorial vai te guiar por cada passo do processo. Vamos lá?',
    action: 'Clique em "Próximo" para começar',
  },

  {
    id: 'create-card',
    title: '1️⃣ Crie seu primeiro card',
    description:
      'Vamos criar um novo card clicando no botão "+" na seção Camadas. Este botão abre uma galeria com 5 templates profissionais.',
    targetElement: '[data-tutorial="create-card-button"]',
    position: 'bottom',
    action: 'Clique no "+" para ver os templates disponíveis',
  },

  {
    id: 'select-template',
    title: '2️⃣ Escolha um template',
    description:
      'A galeria de templates mostra 5 opções profissionais: Simple KPI, Growth YoY, Rating, Progress e Status. Cada um é um starting point perfeito. Escolha o que faz mais sentido para seus dados.',
    targetElement: '[data-tutorial="template-gallery"]',
    position: 'top',
    action: 'Selecione qualquer template para continuar',
  },

  {
    id: 'customize-card',
    title: '3️⃣ Customize seu card',
    description:
      'No painel direito, você pode editar tudo: título, ícone, medida, cores, comparativos e muito mais. O template já vem com uma configuração pronta, mas personalize como desejar.',
    targetElement: '[data-tutorial="right-panel"]',
    position: 'left',
    action: 'Explore os campos: título, ícone e comparativos',
  },

  {
    id: 'copy-paste',
    title: '4️⃣ Reutilize configurações',
    description:
      'Veja os botões Copy e Paste que aparecem ao lado de cada card na lista de Camadas? Use-os para copiar a configuração de um card e colar em outro. Economiza muito tempo!',
    targetElement: '[data-tutorial="layers-panel"]',
    position: 'right',
    action: 'Veja os botões Copy/Paste ao passar o mouse',
  },

  {
    id: 'export-dax',
    title: '5️⃣ Exporte seu DAX',
    description:
      'Quando terminar, clique em "Export DAX" para copiar o código gerado. Cole no seu visual do Power BI e pronto! Seu card visual está funcionando.',
    targetElement: '[data-tutorial="export-dax-button"]',
    position: 'bottom',
    action: 'Clique em "Export DAX" para copiar o código',
  },

  {
    id: 'complete',
    title: '✨ Parabéns! 🎉',
    description:
      'Você aprendeu o essencial do DAXILIZER: criar cards com templates, customizar com copy/paste, e exportar DAX para Power BI. Agora é só aproveitar!',
    action: 'Divirta-se criando seus visuales!',
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
