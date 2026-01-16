// credit score to apr mapping
export const FICO_APR_TABLE = [
  { minScore: 760, maxScore: 850, apr: 6.404, label: '760-850' },
  { minScore: 700, maxScore: 759, apr: 6.626, label: '700-759' },
  { minScore: 680, maxScore: 699, apr: 6.767, label: '680-699' },
  { minScore: 660, maxScore: 679, apr: 7.017, label: '660-679' },
  { minScore: 640, maxScore: 659, apr: 7.447, label: '640-659' },
  { minScore: 620, maxScore: 639, apr: 7.993, label: '620-639' },
] as const;

//lending rate ratios
export const HOUSING_RATIO_CONSERVATIVE = 0.30;
export const HOUSING_RATIO_AGGRESSIVE = 0.36;
export const DEBT_TO_INCOME_RATIO_CONSERVATIVE = 0.36;
export const DEBT_TO_INCOME_RATIO_AGGRESSIVE = 0.43;

//default val
export const DEFAULT_LOAN_TERM_YEARS = 30;
export const DEFAULT_CREDIT_SCORE = 700;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 20;

//loan term options OPTIONAL we have input.
export const LOAN_TERMS = [
  { years: 15, label: '15 years' },
  { years: 30, label: '30 years' },
] as const;
