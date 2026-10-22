import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine, Base
from routers import auth, users, products, carts, orders
from seed_data import seed_products_if_empty

# Automatically create tables for local development / deployment
Base.metadata.create_all(bind=engine)
seed_products_if_empty()

app = FastAPI(
    title="D&G E-Commerce API",
    description="Production backend API for D&G React Native mobile application.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_trace = traceback.format_exc()
    print(f"[Server Error] {error_trace}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_trace}
    )

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(carts.router, prefix="/api/carts", tags=["Carts"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

@app.get("/")
def root():
    return {"message": "D&G E-Commerce Backend is up and running successfully!"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
