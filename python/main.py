from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

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
        # Apply annual increment
        current_monthly = current_monthly * (1 + increment)
        # Apply job switch jump if this is a switch year
        if year % switch_every == 0:
            current_monthly = current_monthly * (1 + jump)

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
