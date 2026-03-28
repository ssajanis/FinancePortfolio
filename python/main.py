from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
