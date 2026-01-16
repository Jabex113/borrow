import {
  FICO_APR_TABLE,
  HOUSING_RATIO_CONSERVATIVE,
  HOUSING_RATIO_CONSERVATIVE_LOW_DOWN,
  DEBT_TO_INCOME_RATIO_CONSERVATIVE,
  AGGRESSIVE_RATIOS,
  PMI_RATES,
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
 * Get ratios based on down payment percentage per MyFICO guidelines
 */
export function getRatios(downPaymentPercent: number): {
  conservative: { housing: number; debt: number };
  aggressive: { housing: number; debt: number };
} {
  // Conservative housing ratio is lower when down payment is under 20%
  const conservativeHousing =
    downPaymentPercent < 20
      ? HOUSING_RATIO_CONSERVATIVE_LOW_DOWN
      : HOUSING_RATIO_CONSERVATIVE;

  // Aggressive ratios vary by down payment
  let aggressiveRatios;
  if (downPaymentPercent < 10) {
    aggressiveRatios = AGGRESSIVE_RATIOS.lowDown;
  } else if (downPaymentPercent < 20) {
    aggressiveRatios = AGGRESSIVE_RATIOS.midDown;
  } else {
    aggressiveRatios = AGGRESSIVE_RATIOS.highDown;
  }

  return {
    conservative: { housing: conservativeHousing, debt: DEBT_TO_INCOME_RATIO_CONSERVATIVE },
    aggressive: { housing: aggressiveRatios.housing, debt: aggressiveRatios.debt },
  };
}

/**
 * PMI rate tiering based on down payment
 */
export function getPMIRate(downPaymentPercent: number): number {
  if (downPaymentPercent < 10) return PMI_RATES.lowDown;
  if (downPaymentPercent < 20) return PMI_RATES.midDown;
  return PMI_RATES.highDown;
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
  const ratios = getRatios(downPaymentPercent);

  // Calculate housing and DTI limits for both scenarios
  const conservativeHousingPayment = monthlyIncome * ratios.conservative.housing;
  const conservativeDtiPayment = calculateMaxPaymentFromDTI(
    monthlyIncome,
    monthlyDebts,
    ratios.conservative.debt
  );
  const aggressiveHousingPayment = monthlyIncome * ratios.aggressive.housing;
  const aggressiveDtiPayment = calculateMaxPaymentFromDTI(
    monthlyIncome,
    monthlyDebts,
    ratios.aggressive.debt
  );

  const pmiRate = getPMIRate(downPaymentPercent);
  const calculateLoanWithPMI = (maxPITI: number) => {
    const maxPandI = Math.max(0, maxPITI - monthlyTaxesInsurance);

    if (maxPandI <= 0) {
      return { loanAmount: 0, monthlyPandI: 0, monthlyPMI: 0, monthlyPayment: 0 };
    }

    // If no PMI, solve directly using P&I budget
    if (pmiRate <= 0) {
      const loanAmount = calculateLoanAmountFromPayment(maxPandI, apr, loanTermYears);
      const monthlyPandI = calculateMonthlyPayment(loanAmount, apr, loanTermYears);
      const monthlyPayment = monthlyPandI + monthlyTaxesInsurance;
      return { loanAmount, monthlyPandI, monthlyPMI: 0, monthlyPayment };
    }

    // Solve for loan amount so that P&I + T&I + PMI == maxPITI
    const maxLoanNoPMI = calculateLoanAmountFromPayment(maxPandI, apr, loanTermYears);
    let low = 0;
    let high = maxLoanNoPMI;

    for (let i = 0; i < 60; i += 1) {
      const mid = (low + high) / 2;
      const monthlyPandI = calculateMonthlyPayment(mid, apr, loanTermYears);
      const monthlyPMI = (mid * pmiRate) / 12;
      const total = monthlyPandI + monthlyTaxesInsurance + monthlyPMI;

      if (total > maxPITI) {
        high = mid;
      } else {
        low = mid;
      }
    }

    const loanAmount = low;
    const monthlyPandI = calculateMonthlyPayment(loanAmount, apr, loanTermYears);
    const monthlyPMI = (loanAmount * pmiRate) / 12;
    const monthlyPayment = monthlyPandI + monthlyTaxesInsurance + monthlyPMI;

    return { loanAmount, monthlyPandI, monthlyPMI, monthlyPayment };
  };

  // conservative: use lower of housing ratio and DTI limit
  const conservativeMaxPITI = Math.min(conservativeHousingPayment, conservativeDtiPayment);
  const conservativeLoanResult = calculateLoanWithPMI(conservativeMaxPITI);
  const conservativeHomePrice =
    conservativeLoanResult.loanAmount / (1 - downPaymentPercent / 100);

  // aggressive: use lower of housing ratio and DTI limit (no extra cap)
  const aggressiveMaxPITI = Math.min(aggressiveHousingPayment, aggressiveDtiPayment);
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
