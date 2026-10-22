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

@app.get("/api/db-schema")
def db_schema():
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """)).fetchall()
        return [{"table": r[0], "column": r[1], "type": r[2], "nullable": r[3]} for r in rows]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.post("/api/reset-db")
def reset_db():
    from database import engine, Base
    import models
    from seed_data import seed_products_if_empty
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_products_if_empty()
    return {"status": "Database tables recreated and seeded successfully"}