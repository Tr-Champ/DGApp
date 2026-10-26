import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import models
from sqlalchemy import text
from database import engine, Base
from routers import auth, users, products, carts, orders
from seed_data import seed_products_if_empty

def auto_migrate_schema():
    """
    Auto-detects and aligns database column types for PostgreSQL / Neon:
    Converts products.id, carts.id, and orders.id from INTEGER/SERIAL to VARCHAR(255)
    to resolve psycopg.errors.DatatypeMismatch when UUID strings are inserted.
    """
    if engine.dialect.name == "postgresql":
        try:
            with engine.begin() as conn:
                for table in ["products", "carts", "orders"]:
                    check_query = text(
                        "SELECT data_type FROM information_schema.columns "
                        "WHERE table_name = :t AND column_name = 'id';"
                    )
                    res = conn.execute(check_query, {"t": table}).fetchone()
                    if res and res[0] in ("integer", "smallint", "bigint"):
                        print(f"[AutoMigrate] Converting {table}.id from {res[0]} to VARCHAR(255)...")
                        conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;"))
                        try:
                            conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN id DROP DEFAULT;"))
                        except Exception:
                            pass
                        print(f"[AutoMigrate] Successfully converted {table}.id to VARCHAR(255)")
        except Exception as e:
            print(f"[AutoMigrate Error] Failed to auto-migrate PostgreSQL columns: {e}")

# Automatically create tables for local development / deployment
Base.metadata.create_all(bind=engine)
auto_migrate_schema()
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
