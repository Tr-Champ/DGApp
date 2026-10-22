from sqlalchemy.orm import Session
from database import SessionLocal
from models.product import Product

SAMPLE_PRODUCTS = [
    {
        "id": "1",
        "name": "Nike Air Max",
        "category": "Shoes",
        "price": 120.00,
        "quantity": 50,
        "info": {
            "brand": "Nike",
            "color": "Black / White",
            "sizes": [40, 41, 42, 43]
        },
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"
        ]
    },
    {
        "id": "2",
        "name": "Leather Luxury Bag",
        "category": "Bags",
        "price": 85.00,
        "quantity": 30,
        "info": {
            "brand": "D&G Collection",
            "color": "Brown",
            "material": "Genuine Leather"
        },
        "images": [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"
        ]
    },
    {
        "id": "3",
        "name": "Classic Chrono Watch",
        "category": "Accessories",
        "price": 199.00,
        "quantity": 25,
        "info": {
            "brand": "Chrono Luxury",
            "color": "Silver / Black",
            "waterproof": "50m"
        },
        "images": [
            "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80"
        ]
    },
    {
        "id": "4",
        "name": "Adidas Ultraboost",
        "category": "Shoes",
        "price": 140.00,
        "quantity": 40,
        "info": {
            "brand": "Adidas",
            "color": "Triple White",
            "sizes": [41, 42, 43, 44]
        },
        "images": [
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80"
        ]
    },
    {
        "id": "5",
        "name": "Dolce Silk Shirt",
        "category": "Clothing",
        "price": 350.00,
        "quantity": 15,
        "info": {
            "brand": "D&G Haute",
            "color": "Floral Pattern",
            "sizes": ["S", "M", "L", "XL"]
        },
        "images": [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"
        ]
    },
    {
        "id": "6",
        "name": "Designer Aviator Sunglasses",
        "category": "Accessories",
        "price": 220.00,
        "quantity": 35,
        "info": {
            "brand": "D&G Eyewear",
            "color": "Gold / Dark Green",
            "uv_protection": "UV400"
        },
        "images": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"
        ]
    },
    {
        "id": "7",
        "name": "Minimalist Canvas Backpack",
        "category": "Bags",
        "price": 65.00,
        "quantity": 45,
        "info": {
            "brand": "Urban Pack",
            "color": "Charcoal Grey",
            "capacity": "20L"
        },
        "images": [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"
        ]
    },
    {
        "id": "8",
        "name": "Premium Denim Jacket",
        "category": "Clothing",
        "price": 110.00,
        "quantity": 20,
        "info": {
            "brand": "Vintage Denim",
            "color": "Vintage Blue",
            "sizes": ["M", "L", "XL"]
        },
        "images": [
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80"
        ]
    }
]

def seed_products_if_empty(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    try:
        count = db.query(Product).count()
        if count == 0:
            for item in SAMPLE_PRODUCTS:
                prod = Product(
                    id=item["id"],
                    name=item["name"],
                    category=item["category"],
                    price=item["price"],
                    quantity=item["quantity"],
                    info=item["info"],
                    images=item["images"]
                )
                db.add(prod)
            db.commit()
            print(f"[Seed] Successfully seeded {len(SAMPLE_PRODUCTS)} products into database.")
    except Exception as e:
        db.rollback()
        print(f"[Seed Error] Failed to seed products: {e}")
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    seed_products_if_empty()
