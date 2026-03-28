from fastapi import FastAPI

app = FastAPI(title="FinanceOS API")


@app.get("/health")
def health():
    return {"status": "ok"}
