import {
  FICO_APR_TABLE,
  HOUSING_RATIO_CONSERVATIVE,
  HOUSING_RATIO_AGGRESSIVE,
  DEBT_TO_INCOME_RATIO_CONSERVATIVE,
  DEBT_TO_INCOME_RATIO_AGGRESSIVE,
} from './constants';

/**
 * Get APR based on credit score 
 */
export function getAPRFromScore(score: number): number {
  for (const tier of FICO_APR_TABLE) {
    if (score >= tier.minScore) {
      return tier.apr;
    }
  }
  // default it to worst tier if below 620 
  return FICO_APR_TABLE[FICO_APR_TABLE.length - 1].apr;
}

/**
 * Calculate monthly mortgage payment using amortization formula
 * 
 * M = P × [r(1+r)^n] / [(1+r)^n - 1] 
 * 
 *   */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}

/**
 * calculate its total interest paid over loan life
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  years: number
): number {
  const totalPaid = monthlyPayment * years * 12;
  return totalPaid - principal;
}

/**
 * calculate loan amount from desired monthly payment (reverse amortization)
 * P = M × [(1 - (1 + r)^-n) / r]
 */
export function calculateLoanAmountFromPayment(
  monthlyPayment: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return monthlyPayment * numPayments;
  }

  const loanAmount =
    monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);

  return loanAmount;
}

/**
 * calculate max allowed housing payment based on income and down payment
 *  29% if down payment < 20%, 30% if >= 20%
 */
export function calculateMaxHousingPayment(
  monthlyIncome: number
): { conservative: number; aggressive: number } {
  const aggressiveRatio = HOUSING_RATIO_AGGRESSIVE;

  return {
    conservative: monthlyIncome * HOUSING_RATIO_CONSERVATIVE,
    aggressive: monthlyIncome * aggressiveRatio,
  };
}

/**
 * calculate max mortgage payment using DTI ratio
 * total debt (including new mortgage) cannot exceed 36% of income
 */
export function calculateMaxPaymentFromDTI(
  monthlyIncome: number,
  monthlyDebts: number,
  ratio: number
): number {
  const maxTotalDebt = monthlyIncome * ratio;
  const availableForMortgage = maxTotalDebt - monthlyDebts;
  return Math.max(0, availableForMortgage);
}

/**
 * calculate how much you can borrow (main function)
 * returns conservative and aggressive estimates
 */
export function calculateHowMuchCanBorrow(
  monthlyIncome: number,
  monthlyDebts: number,
  downPaymentPercent: number,
  creditScore: number,
  loanTermYears: number,
  aprOverride?: number,
  monthlyTaxesInsurance: number = 0
): {
  conservative: {
    loanAmount: number;
    homePrice: number;
    monthlyPayment: number;
    monthlyPMI: number;
    totalInterest: number;
  };
  aggressive: {
    loanAmount: number;
    homePrice: number;
    monthlyPayment: number;
    monthlyPMI: number;
    totalInterest: number;
  };
  apr: number;
} {
  const apr = typeof aprOverride === 'number' ? aprOverride : getAPRFromScore(creditScore);
  const housingPayments = calculateMaxHousingPayment(monthlyIncome);
  const conservativeDtiPayment = calculateMaxPaymentFromDTI(
    monthlyIncome,
    monthlyDebts,
    DEBT_TO_INCOME_RATIO_CONSERVATIVE
  );
  const aggressiveDtiPayment = calculateMaxPaymentFromDTI(
    monthlyIncome,
    monthlyDebts,
    DEBT_TO_INCOME_RATIO_AGGRESSIVE
  );

  const pmiRate = downPaymentPercent < 20 ? 0.0075 : 0;
  const calculateLoanWithPMI = (maxPITI: number) => {
    const basePandI = Math.max(0, maxPITI - monthlyTaxesInsurance);
    const baseLoan = calculateLoanAmountFromPayment(basePandI, apr, loanTermYears);
    const baseMonthlyPMI = pmiRate > 0 ? (baseLoan * pmiRate) / 12 : 0;
    const adjustedPandI = Math.max(0, maxPITI - monthlyTaxesInsurance - baseMonthlyPMI);
    const adjustedLoan = calculateLoanAmountFromPayment(adjustedPandI, apr, loanTermYears);
    const monthlyPMI = pmiRate > 0 ? (adjustedLoan * pmiRate) / 12 : 0;
    const monthlyPayment = adjustedPandI + monthlyTaxesInsurance + monthlyPMI;

    return {
      loanAmount: adjustedLoan,
      monthlyPandI: adjustedPandI,
      monthlyPMI,
      monthlyPayment,
    };
  };

  // conservative: use stricter housing ratio AND DTI limit
  const conservativeMaxPITI = Math.min(housingPayments.conservative, conservativeDtiPayment);
  const conservativeLoanResult = calculateLoanWithPMI(conservativeMaxPITI);
  const conservativeHomePrice =
    conservativeLoanResult.loanAmount / (1 - downPaymentPercent / 100);

  // aggressive: apply front-end cap
  const aggressiveMaxPITI = Math.min(
    housingPayments.aggressive,
    aggressiveDtiPayment,
    monthlyIncome * 0.2882
  );
  const aggressiveLoanResult = calculateLoanWithPMI(aggressiveMaxPITI);
  const aggressiveHomePrice =
    aggressiveLoanResult.loanAmount / (1 - downPaymentPercent / 100);

  return {
    conservative: {
      loanAmount: conservativeLoanResult.loanAmount,
      homePrice: conservativeHomePrice,
      monthlyPayment: conservativeLoanResult.monthlyPayment,
      monthlyPMI: conservativeLoanResult.monthlyPMI,
      totalInterest: calculateTotalInterest(
        conservativeLoanResult.loanAmount,
        conservativeLoanResult.monthlyPandI,
        loanTermYears
      ),
    },
    aggressive: {
      loanAmount: aggressiveLoanResult.loanAmount,
      homePrice: aggressiveHomePrice,
      monthlyPayment: aggressiveLoanResult.monthlyPayment,
      monthlyPMI: aggressiveLoanResult.monthlyPMI,
      totalInterest: calculateTotalInterest(
        aggressiveLoanResult.loanAmount,
        aggressiveLoanResult.monthlyPandI,
        loanTermYears
      ),
    },
    apr,
  };
}

/**
 * Calculate loan Savings comparison across all credit score tiers
 */
export function calculateLoanSavingsComparison(
  loanAmount: number,
  loanTermYears: number
): Array<{
  label: string;
  apr: number;
  monthlyPayment: number;
  totalInterest: number;
}> {
  return FICO_APR_TABLE.map((tier) => {
    const monthlyPayment = calculateMonthlyPayment(loanAmount, tier.apr, loanTermYears);
    const totalInterest = calculateTotalInterest(loanAmount, monthlyPayment, loanTermYears);

    return {
      label: tier.label,
      apr: tier.apr,
      monthlyPayment,
      totalInterest,
    };
  });
}

/**
 * format number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * format number as percentage
 */
export function formatPercent(value: number, decimals: number = 3): string {
  return `${value.toFixed(decimals)}%`;
}
