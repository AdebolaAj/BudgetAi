export type FinancialProfile = {
  fullName: string;
  phoneNumber: string;
  address: string;
  employerName: string;
  taxStatus:
    | ''
    | 'single'
    | 'married_filing_jointly'
    | 'married_filing_separately'
    | 'head_of_household'
    | 'qualifying_surviving_spouse';
  salary: string;
  frequency: 'hourly' | 'monthly' | 'yearly';
  userLocation: string;
  workLocation: string;
  currentSavings: string;
  monthlyRent: string;
  monthlyBills: string;
  monthlyFoodBudget: string;
  monthlyTransport: string;
  monthlyUtilities: string;
  monthlyInsurance: string;
  monthlyPlans: string;
  monthlyDonations: string;
  monthlyEntertainment: string;
  savingsGoal: string;
  investmentAmount: string;
  emergencyFund: string;
  currency: string;
};

export type FinancialReport = {
  initials: string;
  fullName: string;
  grossMonthlyIncome: number;
  monthlyIncome: number;
  projectedMonthlyBalance: number;
  estimatedMonthlyTaxes: number;
  estimatedMonthlyStateLocalTaxes: number;
  monthlyPretaxInsurance: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  monthlyBalance: number;
  currentSavings: number;
  annualSavingsGoal: number;
  savingsGap: number;
  essentialsShare: number;
  savingsRate: number;
  taxEstimateNote: string;
  currentFocus: string;
  focusMessage: string;
  recommendation: string;
  expenseSourceNote: string;
  stats: Array<{
    label: string;
    value: string;
    tone: string;
    note: string;
  }>;
};

type FinancialReportOptions = {
  monthlyExpensesOverride?: number;
  expenseSourceNote?: string;
  currentSavingsOverride?: number;
  monthlyHousingOverride?: number;
};

export type FinancialProfileRow = {
  phone_number: string;
  address: string;
  employer_name: string;
  tax_status: FinancialProfile['taxStatus'];
  frequency: FinancialProfile['frequency'];
  salary: string;
  user_location: string;
  work_location: string;
  current_savings: string;
  monthly_rent: string;
  monthly_bills: string;
  monthly_food_budget: string;
  monthly_transport: string;
  monthly_utilities: string;
  monthly_insurance: string;
  monthly_plans: string;
  monthly_donations: string;
  monthly_entertainment: string;
  savings_goal: string;
  investment_amount: string;
  emergency_fund: string;
  currency: string;
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: 'EUR ',
  GBP: 'GBP ',
  CAD: 'CAD ',
  AUD: 'AUD ',
};

const SINGLE_STANDARD_DEDUCTION_2026 = 16100;
const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200000;

const SINGLE_FEDERAL_BRACKETS_2026 = [
  { upperBound: 11925, rate: 0.1 },
  { upperBound: 48475, rate: 0.12 },
  { upperBound: 103350, rate: 0.22 },
  { upperBound: 197300, rate: 0.24 },
  { upperBound: 250525, rate: 0.32 },
  { upperBound: 626350, rate: 0.35 },
  { upperBound: Number.POSITIVE_INFINITY, rate: 0.37 },
] as const;

const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

const NO_WAGE_INCOME_TAX_STATES = new Set(['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']);

const US_STATE_NAMES: Record<string, string> = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'DISTRICT OF COLUMBIA': 'DC',
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function formatPersonName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/(^|[-'])[a-z]/g, (match) => match.toUpperCase())
    )
    .join(' ');
}

export const emptyFinancialProfile: FinancialProfile = {
  fullName: '',
  phoneNumber: '',
  address: '',
  employerName: '',
  taxStatus: '',
  salary: '',
  frequency: 'monthly',
  userLocation: '',
  workLocation: '',
  currentSavings: '',
  monthlyRent: '',
  monthlyBills: '',
  monthlyFoodBudget: '',
  monthlyTransport: '',
  monthlyUtilities: '',
  monthlyInsurance: '',
  monthlyPlans: '',
  monthlyDonations: '',
  monthlyEntertainment: '',
  savingsGoal: '',
  investmentAmount: '',
  emergencyFund: '',
  currency: 'USD',
};

export function getEmptyFinancialProfile(fullName = ''): FinancialProfile {
  return {
    ...emptyFinancialProfile,
    fullName,
  };
}

export function financialProfileFromRow(
  row: FinancialProfileRow,
  fullName: string
): FinancialProfile {
  return {
    fullName,
    phoneNumber: row.phone_number,
    address: row.address,
    employerName: row.employer_name,
    taxStatus: row.tax_status,
    salary: row.salary,
    frequency: row.frequency,
    userLocation: row.user_location,
    workLocation: row.work_location,
    currentSavings: row.current_savings,
    monthlyRent: row.monthly_rent,
    monthlyBills: row.monthly_bills,
    monthlyFoodBudget: row.monthly_food_budget,
    monthlyTransport: row.monthly_transport,
    monthlyUtilities: row.monthly_utilities,
    monthlyInsurance: row.monthly_insurance,
    monthlyPlans: row.monthly_plans,
    monthlyDonations: row.monthly_donations,
    monthlyEntertainment: row.monthly_entertainment,
    savingsGoal: row.savings_goal,
    investmentAmount: row.investment_amount,
    emergencyFund: row.emergency_fund,
    currency: row.currency,
  };
}

export function formatCurrency(amount: number, currency: string) {
  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${round(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function normalizeMonthlyIncome(profile: FinancialProfile) {
  const income = toNumber(profile.salary);

  if (profile.frequency === 'hourly') {
    return income * 40 * 4.33;
  }

  if (profile.frequency === 'yearly') {
    return income / 12;
  }

  return income;
}

function getFederalIncomeTax(taxableIncome: number) {
  let remainingIncome = taxableIncome;
  let previousUpperBound = 0;
  let totalTax = 0;

  for (const bracket of SINGLE_FEDERAL_BRACKETS_2026) {
    if (remainingIncome <= 0) {
      break;
    }

    const taxableAtBracket = Math.min(remainingIncome, bracket.upperBound - previousUpperBound);
    totalTax += taxableAtBracket * bracket.rate;
    remainingIncome -= taxableAtBracket;
    previousUpperBound = bracket.upperBound;
  }

  return totalTax;
}

function getUsStateCode(location: string) {
  const normalizedLocation = location.trim().toUpperCase();
  if (!normalizedLocation) {
    return null;
  }

  for (const [stateName, stateCode] of Object.entries(US_STATE_NAMES)) {
    if (normalizedLocation.includes(stateName)) {
      return stateCode;
    }
  }

  const locationTokens = normalizedLocation.split(/[^A-Z]+/).filter(Boolean);
  for (const token of locationTokens) {
    if (US_STATE_CODES.has(token)) {
      return token;
    }
  }

  if (normalizedLocation.includes('USA') || normalizedLocation.includes('UNITED STATES')) {
    return 'US';
  }

  return null;
}

function getTaxEstimateNote(profile: FinancialProfile, isUsEstimate: boolean, incomeTypeNote: string) {
  if (!isUsEstimate) {
    return `${incomeTypeNote}. No U.S. state was detected from the location fields, so this amount remains before tax withholding.`;
  }

  const workState = getUsStateCode(profile.workLocation);
  const homeState = getUsStateCode(profile.userLocation);
  const locationNote = workState && workState !== 'US'
    ? `using ${workState} as the work-location context`
    : homeState && homeState !== 'US'
      ? `using ${homeState} as the home-location context`
      : 'using your U.S. location details';

  return `${incomeTypeNote}. Estimated take-home pay applies 2026 U.S. federal income tax, Social Security, Medicare, and pre-tax insurance ${locationNote}. State and local tax support is currently modeled for New York, New York City, Pennsylvania, and Philadelphia.`;
}

function calculateProgressiveTax(
  taxableIncome: number,
  brackets: ReadonlyArray<{ upperBound: number; rate: number }>
) {
  let remainingIncome = taxableIncome;
  let previousUpperBound = 0;
  let totalTax = 0;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) {
      break;
    }

    const taxableAtBracket = Math.min(remainingIncome, bracket.upperBound - previousUpperBound);
    totalTax += taxableAtBracket * bracket.rate;
    remainingIncome -= taxableAtBracket;
    previousUpperBound = bracket.upperBound;
  }

  return totalTax;
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function detectNycResident(location: string) {
  const normalized = location.trim().toUpperCase();
  return includesAny(normalized, [
    'NEW YORK, NY',
    'NEW YORK CITY',
    'MANHATTAN',
    'BROOKLYN',
    'QUEENS',
    'BRONX',
    'STATEN ISLAND',
    'NYC',
  ]);
}

function detectPhiladelphia(location: string) {
  return includesAny(location.trim().toUpperCase(), ['PHILADELPHIA', 'PHILLY']);
}

function getNewYorkStateTax(taxableIncome: number) {
  return calculateProgressiveTax(taxableIncome, [
    { upperBound: 8500, rate: 0.039 },
    { upperBound: 11700, rate: 0.044 },
    { upperBound: 13900, rate: 0.0515 },
    { upperBound: 80650, rate: 0.054 },
    { upperBound: 96800, rate: 0.059 },
    { upperBound: 107650, rate: 0.0633 },
    { upperBound: 215400, rate: 0.0685 },
    { upperBound: 1077550, rate: 0.0965 },
    { upperBound: 5000000, rate: 0.103 },
    { upperBound: 25000000, rate: 0.109 },
    { upperBound: Number.POSITIVE_INFINITY, rate: 0.109 },
  ]);
}

function getNycLocalTax(taxableIncome: number) {
  return calculateProgressiveTax(taxableIncome, [
    { upperBound: 12000, rate: 0.03078 },
    { upperBound: 25000, rate: 0.03762 },
    { upperBound: 50000, rate: 0.03819 },
    { upperBound: Number.POSITIVE_INFINITY, rate: 0.03876 },
  ]);
}

function getPennsylvaniaStateTax(taxableIncome: number) {
  return taxableIncome * 0.0307;
}

function getPhiladelphiaLocalTax(taxableIncome: number, resident: boolean) {
  return taxableIncome * (resident ? 0.0374 : 0.0343);
}

function getStateAndLocalAnnualTaxes(profile: FinancialProfile, annualTaxableIncome: number) {
  const homeState = getUsStateCode(profile.userLocation);
  const workState = getUsStateCode(profile.workLocation);
  const homeLocation = profile.userLocation.trim().toUpperCase();
  const workLocation = profile.workLocation.trim().toUpperCase();

  let annualStateTax = 0;
  let annualLocalTax = 0;
  let note = 'State and local taxes are not modeled for this location yet.';

  if (homeState && NO_WAGE_INCOME_TAX_STATES.has(homeState)) {
    note = `No state wage income tax was applied for ${homeState}.`;
    return { annualStateTax, annualLocalTax, note };
  }

  if (homeState === 'NY') {
    annualStateTax = getNewYorkStateTax(annualTaxableIncome);

    if (detectNycResident(homeLocation)) {
      annualLocalTax = getNycLocalTax(annualTaxableIncome);
      note = 'New York State tax and New York City resident tax were included in the estimate.';
    } else {
      note = 'New York State tax was included in the estimate. Other local New York taxes are not modeled yet.';
    }

    return { annualStateTax, annualLocalTax, note };
  }

  if (homeState === 'PA' || workState === 'PA') {
    annualStateTax = getPennsylvaniaStateTax(annualTaxableIncome);

    if (detectPhiladelphia(homeLocation)) {
      annualLocalTax = getPhiladelphiaLocalTax(annualTaxableIncome, true);
      note = 'Pennsylvania state tax and Philadelphia resident wage tax were included in the estimate.';
    } else if (detectPhiladelphia(workLocation)) {
      annualLocalTax = getPhiladelphiaLocalTax(annualTaxableIncome, false);
      note = 'Pennsylvania state tax and Philadelphia nonresident wage tax were included in the estimate.';
    } else {
      note = 'Pennsylvania state tax was included in the estimate. Other Pennsylvania local taxes are not modeled yet.';
    }

    return { annualStateTax, annualLocalTax, note };
  }

  return { annualStateTax, annualLocalTax, note };
}

export function buildFinancialReport(
  profile: FinancialProfile,
  options: FinancialReportOptions = {}
): FinancialReport {
  const grossMonthlyIncome = normalizeMonthlyIncome(profile);
  const grossAnnualIncome = grossMonthlyIncome * 12;
  const monthlyFoodBudget = toNumber(profile.monthlyFoodBudget);
  const monthlyTransport = toNumber(profile.monthlyTransport);
  const monthlyUtilities = toNumber(profile.monthlyUtilities);
  const monthlyPretaxInsurance = toNumber(profile.monthlyInsurance);
  const monthlyPlans = toNumber(profile.monthlyPlans);
  const monthlyDonations = toNumber(profile.monthlyDonations);
  const monthlyEntertainment = toNumber(profile.monthlyEntertainment);
  const currentSavings = options.currentSavingsOverride ?? toNumber(profile.currentSavings);
  const monthlyHousing = options.monthlyHousingOverride ?? 0;
  const annualSavingsGoal = toNumber(profile.savingsGoal);
  const annualPretaxInsurance = monthlyPretaxInsurance * 12;
  const monthlyCapTotal =
    monthlyFoodBudget +
    monthlyTransport +
    monthlyUtilities +
    monthlyPlans +
    monthlyDonations +
    monthlyEntertainment;

  const incomeTypeNote =
    profile.frequency === 'hourly'
      ? 'Gross pay is estimated using 40 hours per week'
      : profile.frequency === 'yearly'
        ? 'Gross pay is converted from annual income to a monthly estimate'
        : 'Gross pay is based on your reported monthly income';

  const isUsEstimate = Boolean(getUsStateCode(profile.userLocation) || getUsStateCode(profile.workLocation));
  const ficaTaxableIncome = Math.max(grossAnnualIncome - annualPretaxInsurance, 0);
  const federalTaxableIncome = Math.max(
    ficaTaxableIncome - SINGLE_STANDARD_DEDUCTION_2026,
    0
  );
  const federalAnnualTax = isUsEstimate ? getFederalIncomeTax(federalTaxableIncome) : 0;
  const socialSecurityAnnualTax = isUsEstimate
    ? Math.min(ficaTaxableIncome, SOCIAL_SECURITY_WAGE_BASE_2026) * SOCIAL_SECURITY_RATE
    : 0;
  const medicareAnnualTax = isUsEstimate
    ? ficaTaxableIncome * MEDICARE_RATE +
      Math.max(ficaTaxableIncome - ADDITIONAL_MEDICARE_THRESHOLD_SINGLE, 0) *
        ADDITIONAL_MEDICARE_RATE
    : 0;
  const { annualStateTax, annualLocalTax, note: stateLocalNote } = isUsEstimate
    ? getStateAndLocalAnnualTaxes(profile, federalTaxableIncome)
    : { annualStateTax: 0, annualLocalTax: 0, note: 'State and local taxes are not modeled for this location yet.' };
  const estimatedMonthlyStateLocalTaxes = (annualStateTax + annualLocalTax) / 12;
  const estimatedMonthlyTaxes =
    (federalAnnualTax + socialSecurityAnnualTax + medicareAnnualTax) / 12 +
    estimatedMonthlyStateLocalTaxes;
  const monthlyIncome = Math.max(grossMonthlyIncome - monthlyPretaxInsurance - estimatedMonthlyTaxes, 0);

  const monthlyExpenses = options.monthlyExpensesOverride ?? monthlyCapTotal;

  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const monthlyBudget = monthlyCapTotal + monthlyHousing + Math.max(annualSavingsGoal / 12, 0);
  const essentials = monthlyHousing + monthlyFoodBudget + monthlyTransport + monthlyUtilities;
  const essentialsShare = monthlyExpenses > 0 ? Math.round((essentials / monthlyExpenses) * 100) : 0;
  const expenseSourceNote = options.expenseSourceNote ?? `${essentialsShare}% of spend is essential`;
  const savingsRate = monthlyIncome > 0 ? Math.round((Math.max(monthlyBalance, 0) / monthlyIncome) * 100) : 0;
  const savingsGap = Math.max(annualSavingsGoal - currentSavings, 0);

  let currentFocus = 'Cash flow';
  let focusMessage = 'Your report is ready. Keep income ahead of recurring expenses to create room for savings.';
  let recommendation = 'Review recurring costs first, then move part of the remaining monthly balance into a dedicated savings bucket.';

  if (monthlyBalance < 0) {
    currentFocus = 'Reduce monthly burn';
    focusMessage = 'Your current plan is spending more than it brings in each month. Closing that gap should come before new goals.';
    recommendation = 'Start with rent, bills, subscriptions, and dining to find the fastest cuts and bring monthly spending back under income.';
  } else if (annualSavingsGoal > 0 && monthlyBalance < annualSavingsGoal / 12) {
    currentFocus = 'Fund your savings goal';
    focusMessage = 'You are cash-flow positive, but the current monthly surplus may not fully support your stated annual savings target.';
    recommendation = 'Protect your existing surplus and redirect part of discretionary spending so your savings goal becomes automatic each month.';
  } else if (currentSavings < monthlyExpenses * 3) {
    currentFocus = 'Build emergency reserves';
    focusMessage = 'Your spending profile suggests that a stronger emergency buffer would improve resilience.';
    recommendation = 'Use the current monthly balance to build at least three months of core expenses before taking on optional investing goals.';
  }

  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'BA';

  const currency = profile.currency;

  return {
    initials,
    fullName: formatPersonName(profile.fullName) || 'BudgetAI User',
    grossMonthlyIncome,
    monthlyIncome,
    projectedMonthlyBalance: monthlyBalance,
    estimatedMonthlyTaxes,
    estimatedMonthlyStateLocalTaxes,
    monthlyPretaxInsurance,
    monthlyExpenses,
    monthlyBudget,
    monthlyBalance,
    currentSavings,
    annualSavingsGoal,
    savingsGap,
    essentialsShare,
    savingsRate,
    taxEstimateNote: `${getTaxEstimateNote(profile, isUsEstimate, incomeTypeNote)} ${stateLocalNote}`,
    currentFocus,
    focusMessage,
    recommendation,
    expenseSourceNote,
    stats: [
      {
        label: 'Gross Income',
        value: formatCurrency(grossMonthlyIncome, currency),
        tone: 'bg-teal-50 text-teal-700',
        note: incomeTypeNote,
      },
      {
        label: 'Estimated Taxes',
        value: formatCurrency(estimatedMonthlyTaxes, currency),
        tone: 'bg-orange-50 text-orange-700',
        note: isUsEstimate
          ? estimatedMonthlyStateLocalTaxes > 0
            ? `${formatCurrency(estimatedMonthlyStateLocalTaxes, currency)} of state/local tax included`
            : 'Federal payroll tax estimate for 2026 rules'
          : 'No U.S. tax estimate applied',
      },
      {
        label: 'Net Monthly Income',
        value: formatCurrency(monthlyIncome, currency),
        tone: 'bg-emerald-50 text-emerald-700',
        note: monthlyPretaxInsurance > 0
          ? `${formatCurrency(monthlyPretaxInsurance, currency)} in pre-tax insurance removed first`
          : 'Estimated take-home pay after tax withholding',
      },
      {
        label: 'Total Expenses',
        value: formatCurrency(monthlyExpenses, currency),
        tone: 'bg-amber-50 text-amber-700',
        note: expenseSourceNote,
      },
      {
        label: 'Projected Balance',
        value: formatCurrency(monthlyBalance, currency),
        tone: monthlyBalance >= 0 ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700',
        note:
          monthlyBalance >= 0
            ? 'Expected surplus after planned monthly caps'
            : 'Projected plan runs negative',
      },
      {
        label: 'Monthly Budget',
        value: formatCurrency(monthlyBudget, currency),
        tone: 'bg-rose-50 text-rose-700',
        note:
          annualSavingsGoal > 0
            ? monthlyHousing > 0
              ? 'Built from rent, monthly caps, and savings target pace'
              : 'Built from your monthly caps plus savings target pace'
            : monthlyHousing > 0
              ? 'Built from rent and your entered monthly caps'
              : 'Built from your entered monthly caps',
      },
    ],
  };
}
