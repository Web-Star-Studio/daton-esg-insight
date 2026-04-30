// Categoriza uma avaliação de eficácia em Eficaz / Parcialmente Eficaz / Não
// Eficaz. O banco grava `is_effective` (boolean) + `score` codificador
// (10/6/3) — `is_effective` sozinho não distingue Eficaz de Parcial, então
// olhamos o score primeiro.
// Origem: src/components/TrainingEfficacyEvaluationDialog.tsx EFFECTIVENESS_OPTIONS.

export type EfficacyCategory = 'effective' | 'partial' | 'not_effective';

interface EvaluationLike {
  is_effective?: boolean | null;
  score?: number | null;
}

export const getEfficacyCategory = (
  evaluation: EvaluationLike | null | undefined,
): EfficacyCategory | null => {
  if (!evaluation) return null;
  const { is_effective, score } = evaluation;
  if (typeof score === 'number') {
    if (score <= 4) return 'not_effective';
    if (score <= 7) return 'partial';
    return 'effective';
  }
  if (is_effective === true) return 'effective';
  if (is_effective === false) return 'not_effective';
  return null;
};

export const EFFICACY_CATEGORY_LABEL: Record<EfficacyCategory, string> = {
  effective: 'Eficaz',
  partial: 'Parcialmente Eficaz',
  not_effective: 'Não Eficaz',
};

// Classes Tailwind alinhadas ao TrainingEfficacyEvaluationDialog
// (verde / amarelo / vermelho).
export const EFFICACY_CATEGORY_BADGE: Record<EfficacyCategory, string> = {
  effective: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  not_effective: 'bg-red-100 text-red-800 border-red-200',
};
