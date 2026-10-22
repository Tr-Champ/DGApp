from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, users, products, carts, orders

# Automatically create tables for local development / deployment
Base.metadata.create_all(bind=engine)

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

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(carts.router, prefix="/api/carts", tags=["Carts"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

@app.get("/")
def root():
    return {"message": "D&G E-Commerce Backend is up and running successfully!"}