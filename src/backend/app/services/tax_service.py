"""
Thai Personal Income Tax Calculator
ภาษีเงินได้บุคคลธรรมดา — progressive brackets + standard deductions
"""

from dataclasses import dataclass, field


# ── Thai Tax Brackets (effective 2017–present) ──────────────────────
BRACKETS = [
    (0, 150_000, 0.00),
    (150_001, 300_000, 0.05),
    (300_001, 500_000, 0.10),
    (500_001, 750_000, 0.15),
    (750_001, 1_000_000, 0.20),
    (1_000_001, 2_000_000, 0.25),
    (2_000_001, 5_000_000, 0.30),
    (5_000_001, float("inf"), 0.35),
]


def format_money(n: float) -> str:
    return f"{n:,.0f}"


@dataclass
class TaxBracketLine:
    """One row in the tax calculation table."""
    lower: int
    upper: int
    rate: float
    taxable_in_bracket: float = 0.0
    tax_in_bracket: float = 0.0

    @property
    def label(self) -> str:
        if self.upper == float("inf"):
            return f"{self.lower:,}+"
        return f"{self.lower:,} – {self.upper:,}"

    @property
    def rate_pct(self) -> str:
        return f"{self.rate * 100:.0f}%"


@dataclass
class TaxCalculation:
    """Complete tax calculation result."""
    year: int
    gross_income: float
    expense_deduction: float              # หักค่าใช้จ่าย
    income_after_expenses: float
    allowances: dict                      # e.g. {"personal": 60000, "social_security": 9000}
    total_allowances: float
    other_deductions: dict                # e.g. {"life_insurance": 100000}
    total_other_deductions: float
    net_taxable_income: float
    brackets: list[TaxBracketLine] = field(default_factory=list)
    total_tax: float = 0.0
    effective_rate: float = 0.0


def calculate_tax(
    gross_income: float,
    expense_deduction: float = 0.0,
    expense_deduction_pct: float = 0.50,
    expense_deduction_cap: float = 100_000,
    personal_allowance: float = 60_000,
    social_security: float = 0.0,
    spouse_allowance: float = 0.0,
    child_allowance: float = 0.0,
    parent_allowance: float = 0.0,
    life_insurance: float = 0.0,
    health_insurance: float = 0.0,
    rmf_ssf: float = 0.0,
    mortgage_interest: float = 0.0,
    donations: float = 0.0,
) -> TaxCalculation:
    """
    Calculate Thai personal income tax.

    Default expense deduction: 50% of gross income, capped at 100,000 (Section 40(2)).
    Override with expense_deduction for manual/actual expenses.
    """

    # ── Step 1: Expense Deduction ──────────────────────────────────
    if expense_deduction > 0:
        actual_expense = expense_deduction
    else:
        actual_expense = min(gross_income * expense_deduction_pct, expense_deduction_cap)

    income_after_expenses = max(gross_income - actual_expense, 0)

    # ── Step 2: Allowances ─────────────────────────────────────────
    allowances = {}
    if personal_allowance:
        allowances["ส่วนตัว"] = personal_allowance
    if social_security:
        allowances["ประกันสังคม"] = social_security
    if spouse_allowance:
        allowances["คู่สมรส"] = spouse_allowance
    if child_allowance:
        allowances["บุตร"] = child_allowance
    if parent_allowance:
        allowances["บิดามารดา"] = parent_allowance
    total_allowances = sum(allowances.values())

    income_after_allowances = max(income_after_expenses - total_allowances, 0)

    # ── Step 3: Other Deductions ───────────────────────────────────
    deductions = {}
    if life_insurance:
        deductions["ประกันชีวิต"] = life_insurance
    if health_insurance:
        deductions["ประกันสุขภาพ"] = health_insurance
    if rmf_ssf:
        deductions["RMF/SSF"] = rmf_ssf
    if mortgage_interest:
        deductions["ดอกเบี้ยบ้าน"] = mortgage_interest
    if donations:
        deductions["บริจาค"] = donations
    total_deductions = sum(deductions.values())

    net_taxable = max(income_after_allowances - total_deductions, 0)

    # ── Step 4: Apply Brackets ─────────────────────────────────────
    brackets: list[TaxBracketLine] = []
    remaining = net_taxable
    total_tax = 0.0

    for lower, upper, rate in BRACKETS:
        band_width = upper - lower + 1 if upper != float("inf") else float("inf")
        taxable = min(remaining, band_width) if remaining > 0 else 0
        tax = taxable * rate
        brackets.append(TaxBracketLine(
            lower=lower,
            upper=upper,
            rate=rate,
            taxable_in_bracket=taxable,
            tax_in_bracket=tax,
        ))
        total_tax += tax
        remaining -= taxable
        if remaining <= 0:
            break

    effective_rate = (total_tax / gross_income * 100) if gross_income > 0 else 0.0

    return TaxCalculation(
        year=0,  # caller sets
        gross_income=gross_income,
        expense_deduction=actual_expense,
        income_after_expenses=income_after_expenses,
        allowances=allowances,
        total_allowances=total_allowances,
        other_deductions=deductions,
        total_other_deductions=total_deductions,
        net_taxable_income=net_taxable,
        brackets=brackets,
        total_tax=total_tax,
        effective_rate=round(effective_rate, 1),
    )


def quick_tax_estimate(
    gross_income: float,
    extra_deductions: float = 0.0,
) -> dict:
    """
    Quick tax estimate with default freelancer deductions:
    - 50% expense deduction, capped 100K
    - 60K personal allowance
    Returns: { net_taxable, total_tax, effective_rate }
    """
    result = calculate_tax(
        gross_income=gross_income,
        personal_allowance=60_000,
    )
    # Adjust for extra deductions (SSF, insurance, etc.)
    if extra_deductions > 0:
        result = calculate_tax(
            gross_income=gross_income,
            personal_allowance=60_000,
            rmf_ssf=min(extra_deductions, 500_000),
        )
    return {
        "net_taxable_income": result.net_taxable_income,
        "total_tax": result.total_tax,
        "effective_rate": result.effective_rate,
    }
