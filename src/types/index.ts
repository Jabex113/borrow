export interface LoanResult {
  loanAmount: number;
  homePrice: number;
  monthlyPayment: number;
  totalInterest: number;
}

export interface BorrowingResult {
  conservative: LoanResult;
  aggressive: LoanResult;
  apr: number;
}

export interface SavingsComparisonRow {
  label: string;
  apr: number;
  monthlyPayment: number;
  totalInterest: number;
}

export type CalculatorTab = 'loan-savings' | 'how-much-can-i-borrow';
