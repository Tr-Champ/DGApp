import uuid
from sqlalchemy.orm import Session
from models.product import Product
from schemas.product import ProductCreate, ProductUpdate

def get_products(db: Session, category: str = None, search: str = None):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.all()

def get_product_by_id(db: Session, product_id: str):
    return db.query(Product).filter(Product.id == str(product_id)).first()

def create_product(db: Session, product: ProductCreate):
    prod_id = product.id if product.id else str(uuid.uuid4())
    db_product = Product(
        id=prod_id,
        name=product.name,
        category=product.category,
        price=product.price,
        quantity=product.quantity,
        info=product.info or {},
        images=product.images or []
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: str, product_update: ProductUpdate):
    product = db.query(Product).filter(Product.id == str(product_id)).first()
    if not product:
        return None
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product

def delete_product(db: Session, product_id: str):
    product = db.query(Product).filter(Product.id == str(product_id)).first()
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True
