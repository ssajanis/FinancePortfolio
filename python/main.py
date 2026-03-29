import io
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, model_validator
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

app = FastAPI(title="FinanceOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


class CalculateRequest(BaseModel):
    value: float


@app.post("/calculate/test")
def calculate_test(body: CalculateRequest):
    return {
        "input": body.value,
        "doubled": body.value * 2,
        "status": "Python service running ✅",
    }


# ---------------------------------------------------------------------------
# Salary projection models
# ---------------------------------------------------------------------------

class IncomeSource(BaseModel):
    label: str
    owner: Literal["self", "spouse", "other"]
    income_type: Literal["salary", "rental"]
    inflation_rate: Decimal = Field(default=Decimal("6"))

    # Salary fields
    base_monthly_paise: int | None = None
    increment_pct: Decimal | None = None
    switch_jump_pct: Decimal | None = None
    switch_every_years: int | None = None

    # Rental / flat fields
    flat_monthly_paise: int | None = None

    @model_validator(mode="after")
    def check_fields(self):
        if self.income_type == "salary":
            missing = [
                f for f in ("base_monthly_paise", "increment_pct", "switch_jump_pct", "switch_every_years")
                if getattr(self, f) is None
            ]
            if missing:
                raise ValueError(f"Salary source missing fields: {missing}")
        elif self.income_type == "rental":
            if self.flat_monthly_paise is None:
                raise ValueError("Rental source missing flat_monthly_paise")
        return self


class SalaryRequest(BaseModel):
    sources: list[IncomeSource] = Field(min_length=1)


class YearlyEntry(BaseModel):
    year: int
    nominal_monthly_paise: int
    real_monthly_paise: int
    nominal_annual_paise: int
    real_annual_paise: int


class SourceProjection(BaseModel):
    label: str
    owner: str
    yearly: list[YearlyEntry]
    total_nominal_paise: int
    total_real_paise: int


class CombinedYearlyEntry(BaseModel):
    year: int
    nominal_monthly_paise: int
    real_monthly_paise: int


class CombinedProjection(BaseModel):
    yearly: list[CombinedYearlyEntry]
    total_nominal_paise: int
    total_real_paise: int


class SalaryResponse(BaseModel):
    projections: list[SourceProjection]
    combined: CombinedProjection


# ---------------------------------------------------------------------------
# Calculation logic
# ---------------------------------------------------------------------------

YEARS = 10


def project_salary(source: IncomeSource) -> SourceProjection:
    inflation = source.inflation_rate / Decimal("100")
    yearly: list[YearlyEntry] = []
    total_nominal = Decimal("0")
    total_real = Decimal("0")

    current_monthly = Decimal(source.base_monthly_paise)
    increment = source.increment_pct / Decimal("100")
    jump = source.switch_jump_pct / Decimal("100")
    switch_every = source.switch_every_years

    for year in range(1, YEARS + 1):
        if year % switch_every == 0:
            # Switch year: jump replaces the regular increment
            current_monthly = current_monthly * (1 + jump)
        else:
            # Regular year: increment only
            current_monthly = current_monthly * (1 + increment)

        nominal_monthly = current_monthly.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        deflator = (1 + inflation) ** year
        real_monthly = (current_monthly / deflator).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

        nominal_annual = nominal_monthly * 12
        real_annual = real_monthly * 12

        total_nominal += nominal_annual
        total_real += real_annual

        yearly.append(YearlyEntry(
            year=year,
            nominal_monthly_paise=int(nominal_monthly),
            real_monthly_paise=int(real_monthly),
            nominal_annual_paise=int(nominal_annual),
            real_annual_paise=int(real_annual),
        ))

    return SourceProjection(
        label=source.label,
        owner=source.owner,
        yearly=yearly,
        total_nominal_paise=int(total_nominal),
        total_real_paise=int(total_real),
    )


def project_rental(source: IncomeSource) -> SourceProjection:
    inflation = source.inflation_rate / Decimal("100")
    flat = Decimal(source.flat_monthly_paise)
    yearly: list[YearlyEntry] = []
    total_nominal = Decimal("0")
    total_real = Decimal("0")

    for year in range(1, YEARS + 1):
        deflator = (1 + inflation) ** year
        real_monthly = (flat / deflator).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        nominal_annual = flat * 12
        real_annual = real_monthly * 12

        total_nominal += nominal_annual
        total_real += real_annual

        yearly.append(YearlyEntry(
            year=year,
            nominal_monthly_paise=int(flat),
            real_monthly_paise=int(real_monthly),
            nominal_annual_paise=int(nominal_annual),
            real_annual_paise=int(real_annual),
        ))

    return SourceProjection(
        label=source.label,
        owner=source.owner,
        yearly=yearly,
        total_nominal_paise=int(total_nominal),
        total_real_paise=int(total_real),
    )


@app.post("/calculate/salary", response_model=SalaryResponse)
def calculate_salary(body: SalaryRequest):
    projections: list[SourceProjection] = []

    for source in body.sources:
        if source.income_type == "salary":
            projections.append(project_salary(source))
        else:
            projections.append(project_rental(source))

    # Build combined yearly totals
    combined_yearly: list[CombinedYearlyEntry] = []
    total_combined_nominal = Decimal("0")
    total_combined_real = Decimal("0")

    for year_idx in range(YEARS):
        year = year_idx + 1
        nom = sum(p.yearly[year_idx].nominal_monthly_paise for p in projections)
        real = sum(p.yearly[year_idx].real_monthly_paise for p in projections)
        total_combined_nominal += Decimal(nom) * 12
        total_combined_real += Decimal(real) * 12
        combined_yearly.append(CombinedYearlyEntry(
            year=year,
            nominal_monthly_paise=nom,
            real_monthly_paise=real,
        ))

    return SalaryResponse(
        projections=projections,
        combined=CombinedProjection(
            yearly=combined_yearly,
            total_nominal_paise=int(total_combined_nominal),
            total_real_paise=int(total_combined_real),
        ),
    )


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

class PdfYearlyEntry(BaseModel):
    year: int
    nominal_monthly_paise: int
    real_monthly_paise: int
    nominal_annual_paise: int
    real_annual_paise: int


class PdfSourceProjection(BaseModel):
    label: str
    owner: str
    yearly: list[PdfYearlyEntry]
    total_nominal_paise: int
    total_real_paise: int


class PdfCombinedYearlyEntry(BaseModel):
    year: int
    nominal_monthly_paise: int
    real_monthly_paise: int


class PdfCombinedProjection(BaseModel):
    yearly: list[PdfCombinedYearlyEntry]
    total_nominal_paise: int
    total_real_paise: int


class PdfRequest(BaseModel):
    projections: list[PdfSourceProjection]
    combined: PdfCombinedProjection


def fmt(paise: int) -> str:
    rupees = paise / 100
    return f"Rs {rupees:,.0f}"


@app.post("/generate/salary-pdf")
def generate_salary_pdf(body: PdfRequest):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    green = colors.HexColor("#00c853")
    dark = colors.HexColor("#0a0f0d")
    light = colors.HexColor("#e8f5e9")

    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        textColor=green, fontSize=20, spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        textColor=light, fontSize=10, spaceAfter=12
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        textColor=green, fontSize=13, spaceBefore=14, spaceAfter=6
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        textColor=light, fontSize=8, spaceBefore=20, alignment=1
    )

    table_header_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), green),
        ("TEXTCOLOR", (0, 0), (-1, 0), dark),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0d1f17")),
        ("TEXTCOLOR", (0, 1), (-1, -1), light),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1f17"), colors.HexColor("#112318")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#1e3a2a")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    story = []
    story.append(Paragraph("FinanceOS — Salary Projection Report", title_style))
    story.append(Paragraph(f"Generated on {date.today().strftime('%d %B %Y')}", subtitle_style))

    col_widths = [18 * mm, 38 * mm, 38 * mm, 38 * mm, 38 * mm]

    for proj in body.projections:
        story.append(Paragraph(f"{proj.label} ({proj.owner})", section_style))

        rows = [["Year", "Nominal Monthly", "Real Monthly", "Nominal Annual", "Real Annual"]]
        for y in proj.yearly:
            rows.append([
                str(y.year),
                fmt(y.nominal_monthly_paise),
                fmt(y.real_monthly_paise),
                fmt(y.nominal_annual_paise),
                fmt(y.real_annual_paise),
            ])
        rows.append(["Total", "—", "—", fmt(proj.total_nominal_paise), fmt(proj.total_real_paise)])

        t = Table(rows, colWidths=col_widths)
        t.setStyle(table_header_style)
        t.setStyle(TableStyle([
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, -1), (-1, -1), green),
            ("LINEABOVE", (0, -1), (-1, -1), 1, green),
        ]))
        story.append(t)
        story.append(Spacer(1, 6 * mm))

    # Combined section
    story.append(Paragraph("Combined Household", section_style))
    combined_col_widths = [18 * mm, 57 * mm, 57 * mm]
    combined_rows = [["Year", "Nominal Monthly", "Real Monthly"]]
    for y in body.combined.yearly:
        combined_rows.append([str(y.year), fmt(y.nominal_monthly_paise), fmt(y.real_monthly_paise)])
    combined_rows.append([
        "Total",
        fmt(body.combined.total_nominal_paise // 12),
        fmt(body.combined.total_real_paise // 12),
    ])

    ct = Table(combined_rows, colWidths=combined_col_widths)
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), green),
        ("TEXTCOLOR", (0, 0), (-1, 0), dark),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0d1f17")),
        ("TEXTCOLOR", (0, 1), (-1, -1), light),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1f17"), colors.HexColor("#112318")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#1e3a2a")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), green),
        ("LINEABOVE", (0, -1), (-1, -1), 1, green),
    ]))
    story.append(ct)
    story.append(Paragraph("Generated by FinanceOS", footer_style))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=FinanceOS-Salary-Report.pdf"},
    )


# ---------------------------------------------------------------------------
# Expense & Savings Optimizer models
# ---------------------------------------------------------------------------

class FixedExpenseItem(BaseModel):
    name: str
    amount_paise: int


class VariableExpenseItem(BaseModel):
    name: str
    amount_paise: int


class LoanEMIItem(BaseModel):
    name: str
    amount_paise: int
    estimated_balance_paise: int
    interest_rate_pct: Decimal


class OneTimeExpenseItem(BaseModel):
    name: str
    amount_paise: int
    month: int
    year: int


class ExpenseIncomeBreakdown(BaseModel):
    self_paise: int = 0
    spouse_paise: int = 0
    other_paise: int = 0


class ExpenseBreakdownItem(BaseModel):
    category: str
    amount_paise: int
    percentage: float


class ExpenseRequest(BaseModel):
    monthly_income_paise: int
    income_breakdown: ExpenseIncomeBreakdown
    fixed_expenses: list[FixedExpenseItem] = []
    variable_expenses: list[VariableExpenseItem] = []
    loan_emis: list[LoanEMIItem] = []
    one_time_expenses: list[OneTimeExpenseItem] = []


class ExpenseResponse(BaseModel):
    monthly_income_paise: int
    income_breakdown: ExpenseIncomeBreakdown
    total_fixed_paise: int
    total_variable_paise: int
    total_emis_paise: int
    total_one_time_monthly_avg_paise: int
    total_expenses_paise: int
    monthly_surplus_paise: int
    savings_rate_pct: float
    target_savings_rate_pct: float
    savings_gap_pct: float
    amount_to_target_paise: int
    debt_snowball: list[str]
    debt_avalanche: list[str]
    avalanche_saves_more: bool
    investment_opportunity_paise: int
    expense_breakdown: list[ExpenseBreakdownItem]


# ---------------------------------------------------------------------------
# Expense calculation
# ---------------------------------------------------------------------------

@app.post("/calculate/expenses", response_model=ExpenseResponse)
def calculate_expenses(body: ExpenseRequest):
    income = Decimal(body.monthly_income_paise)

    total_fixed = sum(Decimal(e.amount_paise) for e in body.fixed_expenses) if body.fixed_expenses else Decimal("0")
    total_variable = sum(Decimal(e.amount_paise) for e in body.variable_expenses) if body.variable_expenses else Decimal("0")
    total_emis = sum(Decimal(e.amount_paise) for e in body.loan_emis) if body.loan_emis else Decimal("0")

    # One-time: sum all amounts for the year, divide by 12 for monthly average
    total_one_time_annual = sum(Decimal(e.amount_paise) for e in body.one_time_expenses) if body.one_time_expenses else Decimal("0")
    total_one_time_monthly_avg = (total_one_time_annual / Decimal("12")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    total_expenses = total_fixed + total_variable + total_emis + total_one_time_monthly_avg
    monthly_surplus = income - total_expenses

    if income > 0:
        savings_rate = (monthly_surplus / income * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        savings_rate = Decimal("0")

    TARGET = Decimal("30")
    if savings_rate < TARGET:
        savings_gap = (TARGET - savings_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        amount_to_target = (income * savings_gap / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    else:
        savings_gap = Decimal("0")
        amount_to_target = Decimal("0")

    # Debt strategies
    snowball_loans = sorted(body.loan_emis, key=lambda x: x.estimated_balance_paise)
    avalanche_loans = sorted(body.loan_emis, key=lambda x: float(x.interest_rate_pct), reverse=True)

    # Avalanche generally saves more interest; simple heuristic for multiple loans
    avalanche_saves_more = len(body.loan_emis) > 1

    # Investment opportunity: FV of total_variable invested monthly at 12% annual (1%/month)
    # FV = monthly × [((1.01)^120 - 1) / 0.01] × 1.01  (annuity-due)
    monthly_for_invest = total_variable
    fv = monthly_for_invest * ((Decimal("1.01") ** 120 - Decimal("1")) / Decimal("0.01")) * Decimal("1.01")
    fv = fv.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    # Expense breakdown percentages
    breakdown: list[ExpenseBreakdownItem] = []
    for cat, amount in [
        ("Fixed", total_fixed),
        ("Variable", total_variable),
        ("EMIs", total_emis),
        ("One-Time (avg)", total_one_time_monthly_avg),
    ]:
        pct = float((amount / total_expenses * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if total_expenses > 0 else 0.0
        breakdown.append(ExpenseBreakdownItem(category=cat, amount_paise=int(amount), percentage=pct))

    return ExpenseResponse(
        monthly_income_paise=body.monthly_income_paise,
        income_breakdown=body.income_breakdown,
        total_fixed_paise=int(total_fixed),
        total_variable_paise=int(total_variable),
        total_emis_paise=int(total_emis),
        total_one_time_monthly_avg_paise=int(total_one_time_monthly_avg),
        total_expenses_paise=int(total_expenses),
        monthly_surplus_paise=int(monthly_surplus),
        savings_rate_pct=float(savings_rate),
        target_savings_rate_pct=30.0,
        savings_gap_pct=float(savings_gap),
        amount_to_target_paise=int(amount_to_target),
        debt_snowball=[loan.name for loan in snowball_loans],
        debt_avalanche=[loan.name for loan in avalanche_loans],
        avalanche_saves_more=avalanche_saves_more,
        investment_opportunity_paise=int(fv),
        expense_breakdown=breakdown,
    )


# ---------------------------------------------------------------------------
# Expense PDF generation
# ---------------------------------------------------------------------------

@app.post("/generate/expenses-pdf")
def generate_expenses_pdf(body: ExpenseResponse):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    green = colors.HexColor("#00c853")
    dark = colors.HexColor("#0a0f0d")
    light = colors.HexColor("#e8f5e9")
    red = colors.HexColor("#ef5350")

    title_style = ParagraphStyle("ETitle", parent=styles["Title"], textColor=green, fontSize=20, spaceAfter=4)
    subtitle_style = ParagraphStyle("ESubtitle", parent=styles["Normal"], textColor=light, fontSize=10, spaceAfter=12)
    section_style = ParagraphStyle("ESection", parent=styles["Heading2"], textColor=green, fontSize=13, spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("EBody", parent=styles["Normal"], textColor=light, fontSize=9, spaceAfter=4)
    footer_style = ParagraphStyle("EFooter", parent=styles["Normal"], textColor=light, fontSize=8, spaceBefore=20, alignment=1)

    base_table_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), green),
        ("TEXTCOLOR", (0, 0), (-1, 0), dark),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0d1f17")),
        ("TEXTCOLOR", (0, 1), (-1, -1), light),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1f17"), colors.HexColor("#112318")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#1e3a2a")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    story = []
    story.append(Paragraph("FinanceOS — Expense Analysis Report", title_style))
    story.append(Paragraph(f"Generated on {date.today().strftime('%d %B %Y')}", subtitle_style))

    # Section 1: Cash Flow Summary
    story.append(Paragraph("Monthly Cash Flow Summary", section_style))
    cf_rows = [["Item", "Amount"]]
    if body.income_breakdown.self_paise > 0:
        cf_rows.append(["Your Income (Self)", fmt(body.income_breakdown.self_paise)])
    if body.income_breakdown.spouse_paise > 0:
        cf_rows.append(["Spouse Income", fmt(body.income_breakdown.spouse_paise)])
    if body.income_breakdown.other_paise > 0:
        cf_rows.append(["Other Income", fmt(body.income_breakdown.other_paise)])
    cf_rows += [
        ["Total Income", fmt(body.monthly_income_paise)],
        ["", ""],
        ["Total Fixed Expenses", fmt(body.total_fixed_paise)],
        ["Total Variable Expenses", fmt(body.total_variable_paise)],
        ["Total EMIs", fmt(body.total_emis_paise)],
        ["One-Time (monthly avg)", fmt(body.total_one_time_monthly_avg_paise)],
        ["Total Expenses", fmt(body.total_expenses_paise)],
        ["", ""],
        ["Monthly Surplus", fmt(body.monthly_surplus_paise)],
        ["Savings Rate", f"{body.savings_rate_pct:.1f}%"],
    ]
    cf_table = Table(cf_rows, colWidths=[100 * mm, 65 * mm])
    cf_table.setStyle(base_table_style)
    surplus_row_idx = len(cf_rows) - 2
    surplus_color = green if body.monthly_surplus_paise >= 0 else red
    cf_table.setStyle(TableStyle([("TEXTCOLOR", (1, surplus_row_idx), (1, surplus_row_idx), surplus_color)]))
    story.append(cf_table)
    story.append(Spacer(1, 6 * mm))

    # Section 2: Savings Gap Analysis
    story.append(Paragraph("Savings Gap Analysis", section_style))
    if body.savings_gap_pct > 0:
        gap_text = (
            f"Current savings rate: <b>{body.savings_rate_pct:.1f}%</b> — "
            f"Gap to 30% target: <b>{body.savings_gap_pct:.1f}%</b><br/>"
            f"You need an additional <b>{fmt(body.amount_to_target_paise)}/month</b> to reach your savings target.<br/>"
            f"Suggestion: Reduce variable expenses by {fmt(body.amount_to_target_paise)} to reach your target."
        )
    else:
        gap_text = f"You are meeting the 30% savings target. Current rate: <b>{body.savings_rate_pct:.1f}%</b>."
    story.append(Paragraph(gap_text, body_style))
    story.append(Spacer(1, 4 * mm))

    # Section 3: Debt Strategy
    if body.debt_snowball:
        story.append(Paragraph("Debt Strategy Recommendation", section_style))
        rec = "Avalanche method (highest interest first)" if body.avalanche_saves_more else "Snowball method (lowest balance first)"
        story.append(Paragraph(f"Recommended strategy: <b>{rec}</b>", body_style))
        debt_rows = [["#", "Snowball Order", "Avalanche Order"]]
        for i, (s, a) in enumerate(zip(body.debt_snowball, body.debt_avalanche), 1):
            debt_rows.append([str(i), s, a])
        dt = Table(debt_rows, colWidths=[12 * mm, 82 * mm, 82 * mm])
        dt.setStyle(base_table_style)
        story.append(dt)
        story.append(Spacer(1, 6 * mm))

    # Section 4: Investment Opportunity
    story.append(Paragraph("Investment Opportunity", section_style))
    invest_text = (
        f"If you redirect <b>{fmt(body.total_variable_paise)}/month</b> from variable expenses "
        f"into investments at 12% annual return,<br/>"
        f"your corpus grows to <b>{fmt(body.investment_opportunity_paise)}</b> over 10 years.<br/>"
        f"<i>Assumes 1% monthly compounding (annuity-due) over 120 months.</i>"
    )
    story.append(Paragraph(invest_text, body_style))

    story.append(Paragraph("Generated by FinanceOS", footer_style))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=FinanceOS-Expense-Report.pdf"},
    )
