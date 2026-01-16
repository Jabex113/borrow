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
// conservative housing ratio varies by down payment
export const HOUSING_RATIO_CONSERVATIVE = 0.30;
export const HOUSING_RATIO_CONSERVATIVE_LOW_DOWN = 0.28;
export const DEBT_TO_INCOME_RATIO_CONSERVATIVE = 0.36;
//
// <10%: housing 30%, debt 38%
// 10-20%: housing 33%, debt 40%
// >=20%: housing 36%, debt 42%
// >=20%: housing 36%, debt 42%
export const AGGRESSIVE_RATIOS = {
  lowDown: { housing: 0.30, debt: 0.38 },      // down payment < 10%
  midDown: { housing: 0.33, debt: 0.40 },      // down payment 10-20%
  highDown: { housing: 0.36, debt: 0.42 },     // down payment >= 20%
};

// PMI rate tiers to match
export const PMI_RATES = {
  lowDown: 0.01152, // down payment < 10%
  midDown: 0.00336, // down payment 10-20%
  highDown: 0,      // down payment >= 20%
};

//default val
export const DEFAULT_LOAN_TERM_YEARS = 30;
export const DEFAULT_CREDIT_SCORE = 700;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 20;

//loan term options OPTIONAL we have input.
export const LOAN_TERMS = [
  { years: 15, label: '15 years' },
  { years: 30, label: '30 years' },
] as const;
