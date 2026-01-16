# Mortgage Calculators

 React + TypeScript 


## 1) Inputs (monthly)
- **monthly income** = wages + investment + rental + other  
- **monthly debts** = auto + student + credit card + alimony + rental loans + other  
- **m taxes & insurance** = (property tax + homeowners insurance) / 12  
- **APR** = user input (NOT from credit score)

---

## 2) Ratios by down‑payment tier

**Conservative**
- Housing ratio:  
  - `<20%` → **28%**  
  - `>=20%` → **30%**
- debt ratio: **36%** (all tiers)

**Aggressive**
- `<10%` → **housing 30%**, **debt 38%**
- `10–<20%` → **housing 33%**, **debt 40%**
- `>=20%` → **housing 36%**, **debt 42%**

---

## 3) Max allowable PITI (per scene)
```
maxHousing = monthlyIncome * housingRatio
maxDebt    = (monthlyIncome * debtRatio) - monthlyDebts
maxPITI    = min(maxHousing, maxDebt)
```
---

## 4) PMI rate (annual)
- `<10%` → **1.152%**
- `10–<20%` → **0.336%**
- `>=20%` → **0%**

Monthly PMI = `(loanAmount * pmiRate) / 12`

---

## 5) mortage payment formulas

**Monthly P&I**
```
M = P * [r(1+r)^n] / [(1+r)^n - 1]
r = APR / 12
n = years * 12
```
**Reverse (loan from P&I)**
```
P = M * [(1 - (1+r)^-n) / r]
```
---

## 6) Solve loan amount
If PMI = 0:
```
maxP&I = maxPITI - taxesInsurance
loanAmount = reverseAmortization(maxP&I)
```
If PMI > 0 (depends on loan amount), solve iteratively:
- Use **binary search** on loan amount so that:

```
P&I(loan) + taxesInsurance + PMI(loan) = maxPITI
```
---

## 7) Final outputs
```
homePrice  = loanAmount / (1 - downPayment%)
downPayment = homePrice * downPayment%
totalMonthly = P&I + taxesInsurance + PMI
```
---

## Why earlier it failed to match MyFICO's when the downpayment are <20


after applying all given formulas, the outputs should match MyFICO’s

## Getting Started

Install dependencies and start the dev server.

```
npm install
npm run dev
```

## Build

```
npm run build
```








# NOTE

God is GOOOODDDD