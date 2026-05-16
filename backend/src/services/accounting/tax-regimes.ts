// Pluggable tax regime calculators. Each regime takes a period summary
// (gross income, deductible expenses) and returns a breakdown of what the
// specialist owes — itemised by tax component so the UI can show "5% single
// tax · 22% ESV · 1.5% war tax" individually.
//
// Add a new regime by exporting another entry in TAX_REGIMES.

export interface TaxPeriodSummary {
  grossIncome: number;          // sum of completed-booking revenue
  deductibleExpenses: number;   // sum of expenses marked isTaxDeductible
  vatPaid: number;              // sum of expense.vatAmount (input VAT)
  currency: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface TaxLine {
  name: string;
  description: string;
  ratePct?: number;
  basis: number;                // amount the rate was applied to
  amount: number;
}

export interface TaxComputation {
  regime: string;
  regimeLabel: string;
  totalTax: number;
  taxableBase: number;
  netIncome: number;            // grossIncome - deductibleExpenses - totalTax
  lines: TaxLine[];
  notes: string[];
}

type Calculator = (s: TaxPeriodSummary) => TaxComputation;

// Ukraine — Спрощена система оподаткування, FOP Group 3 (most common for IT/services).
// 5% single tax on revenue (no expense deduction) + 22% ESV on minimum wage + 1.5% war tax.
// Values for 2026 are placeholders — keep updated.
const UA_MIN_WAGE_2026 = 8000;
const UA_FOP_GROUP_3: Calculator = (s) => {
  const periodMonths = monthsBetween(s.periodStart, s.periodEnd);
  const singleTaxRate = 0.05;
  const esvRate = 0.22;
  const warTaxRate = 0.015;
  const singleTax = s.grossIncome * singleTaxRate;
  const esv = UA_MIN_WAGE_2026 * esvRate * periodMonths;
  const warTax = s.grossIncome * warTaxRate;
  const totalTax = singleTax + esv + warTax;
  return {
    regime: 'UA_FOP_GROUP_3',
    regimeLabel: 'Ukraine — FOP Group 3 (5% single tax)',
    totalTax,
    taxableBase: s.grossIncome,
    netIncome: s.grossIncome - s.deductibleExpenses - totalTax,
    lines: [
      { name: 'Single tax (5%)', description: 'Єдиний податок на доходи', ratePct: 5, basis: s.grossIncome, amount: singleTax },
      { name: 'ESV (22% × min wage)', description: `Єдиний соц. внесок (${UA_MIN_WAGE_2026} грн × ${periodMonths.toFixed(2)} мес × 22%)`, ratePct: 22, basis: UA_MIN_WAGE_2026 * periodMonths, amount: esv },
      { name: 'War tax (1.5%)', description: 'Військовий збір', ratePct: 1.5, basis: s.grossIncome, amount: warTax },
    ],
    notes: [
      'FOP Group 3 doesn\'t deduct expenses — single tax is on revenue.',
      'Annual revenue cap: ~8.3M UAH for 2026. Exceed → reclassified.',
      'Min wage assumption: 8000 UAH/month. Update when official figure changes.',
    ],
  };
};

const UA_FOP_GROUP_2: Calculator = (s) => {
  const periodMonths = monthsBetween(s.periodStart, s.periodEnd);
  // Group 2: fixed monthly tax = 20% of min wage. Plus ESV + war tax.
  const monthlyFixed = UA_MIN_WAGE_2026 * 0.20;
  const singleTax = monthlyFixed * periodMonths;
  const esv = UA_MIN_WAGE_2026 * 0.22 * periodMonths;
  const warTax = s.grossIncome * 0.015;
  const totalTax = singleTax + esv + warTax;
  return {
    regime: 'UA_FOP_GROUP_2',
    regimeLabel: 'Ukraine — FOP Group 2 (fixed monthly tax)',
    totalTax,
    taxableBase: s.grossIncome,
    netIncome: s.grossIncome - s.deductibleExpenses - totalTax,
    lines: [
      { name: 'Fixed monthly tax', description: `20% × ${UA_MIN_WAGE_2026} × ${periodMonths.toFixed(2)} months`, basis: monthlyFixed * periodMonths, amount: singleTax },
      { name: 'ESV (22% × min wage)', description: 'Єдиний соц. внесок', ratePct: 22, basis: UA_MIN_WAGE_2026 * periodMonths, amount: esv },
      { name: 'War tax (1.5%)', description: 'Військовий збір', ratePct: 1.5, basis: s.grossIncome, amount: warTax },
    ],
    notes: [
      'Group 2 allows only B2C and B2B-to-other-simplified-taxpayers (no general businesses).',
      'Annual cap: ~5.6M UAH for 2026.',
      'Up to 10 employees.',
    ],
  };
};

// Cambodia — flat 10% personal income tax on net business income (simplified).
// Real Cambodian tax is progressive and depends on residency / business structure;
// this is a rough estimator. Always confirm with a local accountant before filing.
const KH_FLAT_10: Calculator = (s) => {
  const netBase = Math.max(0, s.grossIncome - s.deductibleExpenses);
  const incomeTax = netBase * 0.10;
  return {
    regime: 'KH_FLAT_10',
    regimeLabel: 'Cambodia — simplified 10% on net income',
    totalTax: incomeTax,
    taxableBase: netBase,
    netIncome: netBase - incomeTax,
    lines: [
      { name: 'Income tax (10%)', description: 'Simplified — gross income minus deductible expenses, taxed at flat 10%', ratePct: 10, basis: netBase, amount: incomeTax },
    ],
    notes: [
      'This is a simplified estimator. Actual Cambodian tax is progressive (0/5/10/15/20%) and varies by residency and business type.',
      'Confirm with a Cambodian tax accountant before filing.',
    ],
  };
};

// Generic flat rate — for any country where the specialist wants a simple net-income calc.
const FLAT_NET = (rate: number, label: string): Calculator => (s) => {
  const netBase = Math.max(0, s.grossIncome - s.deductibleExpenses);
  const tax = netBase * rate;
  return {
    regime: `FLAT_${(rate * 100).toFixed(0)}`,
    regimeLabel: label,
    totalTax: tax,
    taxableBase: netBase,
    netIncome: netBase - tax,
    lines: [{ name: `Flat ${(rate * 100).toFixed(0)}%`, description: 'on net income', ratePct: rate * 100, basis: netBase, amount: tax }],
    notes: ['Generic flat-rate estimator — informational only.'],
  };
};

// No tax — for the report endpoint when user has no regime configured.
const NONE: Calculator = (s) => ({
  regime: 'NONE',
  regimeLabel: 'No regime selected',
  totalTax: 0,
  taxableBase: 0,
  netIncome: s.grossIncome - s.deductibleExpenses,
  lines: [],
  notes: ['Set your tax regime in account settings to get an estimate. This is a calculator, never a substitute for an accountant.'],
});

export const TAX_REGIMES: Record<string, Calculator> = {
  UA_FOP_GROUP_3,
  UA_FOP_GROUP_2,
  KH_FLAT_10,
  FLAT_5: FLAT_NET(0.05, 'Generic — 5% flat on net'),
  FLAT_15: FLAT_NET(0.15, 'Generic — 15% flat on net'),
  FLAT_20: FLAT_NET(0.20, 'Generic — 20% flat on net'),
  NONE,
};

export function listTaxRegimes(): { id: string; label: string }[] {
  return Object.entries(TAX_REGIMES).map(([id, fn]) => {
    const sample = fn({
      grossIncome: 0,
      deductibleExpenses: 0,
      vatPaid: 0,
      currency: 'UAH',
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    return { id, label: sample.regimeLabel };
  });
}

export function computeTax(regimeId: string, summary: TaxPeriodSummary): TaxComputation {
  const calc = TAX_REGIMES[regimeId] || TAX_REGIMES.NONE;
  return calc(summary);
}

function monthsBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.4375));
}
