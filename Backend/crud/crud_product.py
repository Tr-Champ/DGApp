from sqlalchemy.orm import Session
from models.product import Product

def get_products(db: Session, category: str = None, search: str = None):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.all()

def get_product_by_id(db: Session, product_id: str):
    return db.query(Product).filter(Product.id == product_id).first()