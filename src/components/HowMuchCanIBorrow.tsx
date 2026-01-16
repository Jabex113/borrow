import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Info,
  ChevronUp,
} from 'lucide-react';
import { calculateHowMuchCanBorrow, formatCurrency } from '../utils/finance';
import { LOAN_TERMS } from '../utils/constants';
import './HowMuchCanIBorrow.css';

export function HowMuchCanIBorrow() {
  const [wagesIncome, setWagesIncome] = useState(6000);
  const [investmentIncome, setInvestmentIncome] = useState(12000);
  const [rentalIncome, setRentalIncome] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);

  const [autoLoans, setAutoLoans] = useState(0);
  const [studentLoans, setStudentLoans] = useState(0);
  const [creditCardPayments, setCreditCardPayments] = useState(0);
  const [alimonyPayments, setAlimonyPayments] = useState(0);
  const [rentalLoans, setRentalLoans] = useState(0);
  const [otherPayments, setOtherPayments] = useState(0);

  const [interestRate, setInterestRate] = useState(5);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [propertyTaxYearly, setPropertyTaxYearly] = useState(3252);
  const [insuranceYearly, setInsuranceYearly] = useState(996);

  const [showDetails, setShowDetails] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [graphMode, setGraphMode] = useState<'loan' | 'payment'>('loan');
  const [colorPatterns, setColorPatterns] = useState(false);

  const [incomeOpen, setIncomeOpen] = useState(true);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [loanInfoOpen, setLoanInfoOpen] = useState(false);

  const toggleSection = (section: 'income' | 'payments' | 'loan') => {
    setIncomeOpen(section === 'income' ? !incomeOpen : false);
    setPaymentsOpen(section === 'payments' ? !paymentsOpen : false);
    setLoanInfoOpen(section === 'loan' ? !loanInfoOpen : false);
  };

  const monthlyIncome = wagesIncome + investmentIncome + rentalIncome + otherIncome;
  const monthlyDebts =
    autoLoans + studentLoans + creditCardPayments + alimonyPayments + rentalLoans + otherPayments;

  const monthlyTaxesInsurance = (propertyTaxYearly + insuranceYearly) / 12;

  const results = useMemo(
    () =>
      calculateHowMuchCanBorrow(
        monthlyIncome,
        monthlyDebts,
        downPaymentPercent,
        760,
        loanTermYears,
        interestRate,
        monthlyTaxesInsurance
      ),
    [
      monthlyIncome,
      monthlyDebts,
      downPaymentPercent,
      loanTermYears,
      interestRate,
      monthlyTaxesInsurance,
    ]
  );

  const downPaymentConservative = results.conservative.homePrice * (downPaymentPercent / 100);
  const downPaymentAggressive = results.aggressive.homePrice * (downPaymentPercent / 100);

  const conservativePrincipalInterest = Math.max(
    0,
    results.conservative.monthlyPayment - monthlyTaxesInsurance - results.conservative.monthlyPMI
  );
  const aggressivePrincipalInterest = Math.max(
    0,
    results.aggressive.monthlyPayment - monthlyTaxesInsurance - results.aggressive.monthlyPMI
  );
  const monthlyPropertyTax = propertyTaxYearly / 12;
  const monthlyInsurance = insuranceYearly / 12;
  const isCustomTerm = !LOAN_TERMS.some((term) => term.years === loanTermYears);
  const termOptions = isCustomTerm
    ? [{ years: loanTermYears, label: `${loanTermYears} years` }, ...LOAN_TERMS]
    : LOAN_TERMS;

  const graphConservativeValue =
    graphMode === 'loan' ? results.conservative.loanAmount : results.conservative.monthlyPayment;
  const graphAggressiveValue =
    graphMode === 'loan' ? results.aggressive.loanAmount : results.aggressive.monthlyPayment;
  const graphMax = Math.max(graphConservativeValue, graphAggressiveValue, 1);
  const minVisiblePercent = 6;
  const getBarHeight = (value: number) => {
    if (value <= 0) return '0%';
    const percent = (value / graphMax) * 100;
    if (graphMode === 'loan') {
      return `${Math.max(percent, minVisiblePercent)}%`;
    }
    return `${percent}%`;
  };
  const conservativeHeight = getBarHeight(graphConservativeValue);
  const aggressiveHeight = getBarHeight(graphAggressiveValue);
  const tickCount = 5;
  const step = Math.ceil(graphMax / tickCount / 100) * 100;
  const yAxisTicks = Array.from({ length: tickCount + 1 }, (_, i) => step * (tickCount - i));
  const formatTick = (value: number) =>
    graphMode === 'payment' ? `${Math.round(value / 1000)}k` : formatCurrency(value);
  const conservativePIHeight = `${(conservativePrincipalInterest / graphMax) * 100}%`;
  const aggressivePIHeight = `${(aggressivePrincipalInterest / graphMax) * 100}%`;
  const taxesHeightConservative = `${
    ((monthlyTaxesInsurance + results.conservative.monthlyPMI) / graphMax) * 100
  }%`;
  const taxesHeightAggressive = `${
    ((monthlyTaxesInsurance + results.aggressive.monthlyPMI) / graphMax) * 100
  }%`;
  const [hoveredBar, setHoveredBar] = useState<'conservative' | 'aggressive' | null>(null);

  return (
    <div className="how-much-can-i-borrow">
      <div className="main-layout">
        <div className="input-panel">
          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('income')}
          >
            {incomeOpen ? (
              <ChevronDown className="section-icon" aria-hidden="true" />
            ) : (
              <ChevronRight className="section-icon" aria-hidden="true" />
            )}
            <span>Monthly Income</span>
          </button>
          {incomeOpen && (
            <div className="section-body">
              <div className="input-group">
                <label>Wages before taxes and deductions</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={wagesIncome}
                    onChange={(e) => setWagesIncome(Number(e.target.value))}
                    min={0}
                    step={100}
                  />
                </div>
                <input
                  type="range"
                  value={wagesIncome}
                  onChange={(e) => setWagesIncome(Number(e.target.value))}
                  min={0}
                  max={30000}
                  step={100}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Investment income before taxes</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={investmentIncome}
                    onChange={(e) => setInvestmentIncome(Number(e.target.value))}
                    min={0}
                    step={100}
                  />
                </div>
                <input
                  type="range"
                  value={investmentIncome}
                  onChange={(e) => setInvestmentIncome(Number(e.target.value))}
                  min={0}
                  max={30000}
                  step={100}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Income from rental properties</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={rentalIncome}
                    onChange={(e) => setRentalIncome(Number(e.target.value))}
                    min={0}
                    step={100}
                  />
                </div>
                <input
                  type="range"
                  value={rentalIncome}
                  onChange={(e) => setRentalIncome(Number(e.target.value))}
                  min={0}
                  max={30000}
                  step={100}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Other income</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                    min={0}
                    step={100}
                  />
                </div>
                <input
                  type="range"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  min={0}
                  max={30000}
                  step={100}
                  className="slider"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('payments')}
          >
            {paymentsOpen ? (
              <ChevronDown className="section-icon" aria-hidden="true" />
            ) : (
              <ChevronRight className="section-icon" aria-hidden="true" />
            )}
            <span>Monthly Payments</span>
          </button>
          {paymentsOpen && (
            <div className="section-body">
              <div className="input-group">
                <label>Auto loans</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={autoLoans}
                    onChange={(e) => setAutoLoans(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={autoLoans}
                  onChange={(e) => setAutoLoans(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Student loans</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={studentLoans}
                    onChange={(e) => setStudentLoans(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={studentLoans}
                  onChange={(e) => setStudentLoans(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Credit card</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={creditCardPayments}
                    onChange={(e) => setCreditCardPayments(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={creditCardPayments}
                  onChange={(e) => setCreditCardPayments(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Alimony & child support</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={alimonyPayments}
                    onChange={(e) => setAlimonyPayments(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={alimonyPayments}
                  onChange={(e) => setAlimonyPayments(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Rental property loans</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={rentalLoans}
                    onChange={(e) => setRentalLoans(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={rentalLoans}
                  onChange={(e) => setRentalLoans(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>Other payments</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={otherPayments}
                    onChange={(e) => setOtherPayments(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={otherPayments}
                  onChange={(e) => setOtherPayments(Number(e.target.value))}
                  min={0}
                  max={5000}
                  step={50}
                  className="slider"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className="section-toggle"
            onClick={() => toggleSection('loan')}
          >
            {loanInfoOpen ? (
              <ChevronDown className="section-icon" aria-hidden="true" />
            ) : (
              <ChevronRight className="section-icon" aria-hidden="true" />
            )}
            <span>Loan Info</span>
          </button>
          {loanInfoOpen && (
            <div className="section-body">
              <div className="input-group">
                <label>
                  Interest rate <Info className="info-icon" aria-hidden="true" />
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    min={0}
                    step={0.125}
                  />
                  <span className="suffix">%</span>
                </div>
                <input
                  type="range"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.125}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>
                  Term (years) <Info className="info-icon" aria-hidden="true" />
                </label>
                <div className="input-with-select">
                  <input
                    type="number"
                    min={5}
                    max={40}
                    step={1}
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                  />
                  <select
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                    aria-label="Select loan term"
                  >
                    {termOptions.map((term) => (
                      <option key={term.years} value={term.years}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>
                  Down payment <Info className="info-icon" aria-hidden="true" />
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    min={0}
                    max={50}
                    step={0.5}
                  />
                  <span className="suffix">%</span>
                </div>
                <input
                  type="range"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  min={0}
                  max={50}
                  step={0.5}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>
                  Property tax (yearly) <Info className="info-icon" aria-hidden="true" />
                </label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={propertyTaxYearly}
                    onChange={(e) => setPropertyTaxYearly(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={propertyTaxYearly}
                  onChange={(e) => setPropertyTaxYearly(Number(e.target.value))}
                  min={0}
                  max={20000}
                  step={50}
                  className="slider"
                />
              </div>
              <div className="input-group">
                <label>
                  Homeowners insurance (yearly) <Info className="info-icon" aria-hidden="true" />
                </label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={insuranceYearly}
                    onChange={(e) => setInsuranceYearly(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <input
                  type="range"
                  value={insuranceYearly}
                  onChange={(e) => setInsuranceYearly(Number(e.target.value))}
                  min={0}
                  max={10000}
                  step={50}
                  className="slider"
                />
              </div>
            </div>
          )}

          {loanInfoOpen && downPaymentPercent < 20 && (
            <div className="warning-note">
              <AlertTriangle className="warning-icon" aria-hidden="true" />
              <span>
                Down payment under 20% means stricter lending rules (28% housing ratio instead
                of 32%).
              </span>
            </div>
          )}
        </div>

        <div className="results-panel">
          <div className="result-header">
            <p className="result-title">
              You may qualify for a loan amount ranging from{' '}
              <strong>{formatCurrency(results.conservative.loanAmount)}</strong>
              <span className="result-label">(conservative)</span> to{' '}
              <strong>{formatCurrency(results.aggressive.loanAmount)}</strong>
              <span className="result-label">(aggressive)</span>
            </p>
            <div className="result-actions">
              <button
                type="button"
                className="details-button"
                aria-expanded={showDetails}
                onClick={() => setShowDetails((prev) => !prev)}
              >
                <ChevronUp className={`details-icon ${showDetails ? 'open' : ''}`} />
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              <label className="color-toggle">
                <input
                  type="checkbox"
                  checked={colorPatterns}
                  onChange={(e) => setColorPatterns(e.target.checked)}
                />
                Enable color patterns
              </label>
            </div>
          </div>

          {showDetails && (
            <div className="details-card">
              <div className="details-header">
                <span />
                <span>Conservative Estimate</span>
                <span>Aggressive Estimate</span>
              </div>
              <div className="details-row">
                <span className="row-label">Home price</span>
                <span className="row-value">{formatCurrency(results.conservative.homePrice)}</span>
                <span className="row-value">{formatCurrency(results.aggressive.homePrice)}</span>
              </div>
              <div className="details-row">
                <span className="row-label">Down payment</span>
                <span className="row-value">{formatCurrency(downPaymentConservative)}</span>
                <span className="row-value">{formatCurrency(downPaymentAggressive)}</span>
              </div>
              <div className="details-row emphasized">
                <span className="row-label">Loan amount</span>
                <span className="row-value">{formatCurrency(results.conservative.loanAmount)}</span>
                <span className="row-value">{formatCurrency(results.aggressive.loanAmount)}</span>
              </div>
              <div className="details-row">
                <span className="row-label">Principal and interest</span>
                <span className="row-value">{formatCurrency(conservativePrincipalInterest)}</span>
                <span className="row-value">{formatCurrency(aggressivePrincipalInterest)}</span>
              </div>
              <div className="details-row">
                <span className="row-label">Property taxes</span>
                <span className="row-value">{formatCurrency(monthlyPropertyTax)}</span>
                <span className="row-value">{formatCurrency(monthlyPropertyTax)}</span>
              </div>
              <div className="details-row">
                <span className="row-label">Insurance</span>
                <span className="row-value">{formatCurrency(monthlyInsurance)}</span>
                <span className="row-value">{formatCurrency(monthlyInsurance)}</span>
              </div>
              <div className="details-row total">
                <span className="row-label">Total monthly payment</span>
                <span className="row-value">{formatCurrency(results.conservative.monthlyPayment)}</span>
                <span className="row-value">{formatCurrency(results.aggressive.monthlyPayment)}</span>
              </div>
            </div>
          )}

          <div className={`graph-card ${colorPatterns ? 'patterned' : ''}`}>
            <div className="graph-header">
              <span className="graph-title">{graphMode === 'loan' ? 'Loan Amount' : 'Payment'}</span>
              <button
                type="button"
                className={`graph-icon ${showTable ? 'active' : ''}`}
                aria-label="Table view"
                onClick={() => setShowTable((prev) => !prev)}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            {showTable ? (
              <div className="graph-table">
                <div className="table-title">
                  Table comparing the loan amount for both the conservative and the aggressive estimate
                </div>
                <div className="table-grid">
                  <div className="table-row header">
                    <span>Category</span>
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                  <div className="table-row">
                    <span>Loan Amount</span>
                    <span>{formatCurrency(results.conservative.loanAmount)}</span>
                    <span>{formatCurrency(results.aggressive.loanAmount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="graph-body">
                  <div className="graph-y-axis">
                    {yAxisTicks.map((tick) => (
                      <span key={tick}>{formatTick(tick)}</span>
                    ))}
                  </div>
                  <div className="graph-bars">
                    <div
                      className={`graph-bar conservative ${
                        hoveredBar === 'aggressive' ? 'blurred' : ''
                      } ${hoveredBar === 'conservative' ? 'active' : ''}`}
                    >
                      {graphMode === 'payment' ? (
                        <>
                          <span
                            className="bar-segment taxes"
                            style={{ height: taxesHeightConservative }}
                            onMouseEnter={() => setHoveredBar('conservative')}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                          <span
                            className="bar-segment principal"
                            style={{ height: conservativePIHeight }}
                            onMouseEnter={() => setHoveredBar('conservative')}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        </>
                      ) : (
                        <span
                          style={{ height: conservativeHeight }}
                          onMouseEnter={() => setHoveredBar('conservative')}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      )}
                      {hoveredBar === 'conservative' && (
                        <div className="bar-tooltip">
                          <strong>Conservative</strong>
                          {graphMode === 'payment' ? (
                            <>
                              <div>
                                Principal & Interest:{' '}
                                {formatCurrency(conservativePrincipalInterest)}
                              </div>
                              <div>
                                Taxes, Insurance & PMI:{' '}
                                {formatCurrency(
                                  monthlyTaxesInsurance + results.conservative.monthlyPMI
                                )}
                              </div>
                            </>
                          ) : (
                            <div>Loan Amount: {formatCurrency(results.conservative.loanAmount)}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className={`graph-bar aggressive ${
                        hoveredBar === 'conservative' ? 'blurred' : ''
                      } ${hoveredBar === 'aggressive' ? 'active' : ''}`}
                    >
                      {graphMode === 'payment' ? (
                        <>
                          <span
                            className="bar-segment taxes"
                            style={{ height: taxesHeightAggressive }}
                            onMouseEnter={() => setHoveredBar('aggressive')}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                          <span
                            className="bar-segment principal"
                            style={{ height: aggressivePIHeight }}
                            onMouseEnter={() => setHoveredBar('aggressive')}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        </>
                      ) : (
                        <span
                          style={{ height: aggressiveHeight }}
                          onMouseEnter={() => setHoveredBar('aggressive')}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      )}
                      {hoveredBar === 'aggressive' && (
                        <div className="bar-tooltip">
                          <strong>Aggressive</strong>
                          {graphMode === 'payment' ? (
                            <>
                              <div>
                                Principal & Interest:{' '}
                                {formatCurrency(aggressivePrincipalInterest)}
                              </div>
                              <div>
                                Taxes, Insurance & PMI:{' '}
                                {formatCurrency(
                                  monthlyTaxesInsurance + results.aggressive.monthlyPMI
                                )}
                              </div>
                            </>
                          ) : (
                            <div>Loan Amount: {formatCurrency(results.aggressive.loanAmount)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="graph-x-axis">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
                <div className="graph-legend">
                  <span className="legend-item">
                      <span className="legend-dot conservative" /> Conservative
                  </span>
                  <span className="legend-item">
                      <span className="legend-dot aggressive" /> Aggressive
                  </span>
                </div>
                <div className="graph-toggle">
                  <div className="toggle-row">
                    <button
                      type="button"
                      className={`toggle-dot ${graphMode === 'loan' ? 'active' : ''}`}
                      onClick={() => setGraphMode('loan')}
                      aria-label="Loan amount"
                    />
                    <button
                      type="button"
                      className={`toggle-dot ${graphMode === 'payment' ? 'active' : ''}`}
                      onClick={() => setGraphMode('payment')}
                      aria-label="Payment"
                    />
                  </div>
                  <div className="toggle-labels">
                    <span>Loan Amount</span>
                    <span>Payment</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
