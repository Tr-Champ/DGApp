# ==========================================================
# D&G E-COMMERCE COMPLETE API ENDPOINTS
# Base URL: https://dgapp.onrender.com
# ==========================================================

# ..........................................................
# API 1: Register New User Account (Hardware Device Lock)
# ..........................................................
# Method: POST
# URL: https://dgapp.onrender.com/api/auth/register
# Headers: Content-Type: application/json
# Request Body:
{
  "email": "john@gmail.com",
  "device_token": "c3b9b4f2-95b6-4b45-a7b2-850f4a478b12",
  "is_admin": false
}
# Expected Response (201 Created):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "1",
    "email": "john@gmail.com",
    "is_admin": false
  }
}


# ..........................................................
# API 2: User Login (Hardware Device Lock)
# ..........................................................
# Method: POST
# URL: https://dgapp.onrender.com/api/auth/login
# Headers: Content-Type: application/json
# Request Body:
{
  "device_token": "c3b9b4f2-95b6-4b45-a7b2-850f4a478b12"
}
# Expected Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "1",
    "email": "john@gmail.com",
    "is_admin": false
  }
}


# ..........................................................
# API 2B: Rebind Device (Account Recovery / Replacement)
# ..........................................................
# Method: POST
# URL: https://dgapp.onrender.com/api/auth/rebind-device
# Headers: Content-Type: application/json
# Request Body:
{
  "email": "john@gmail.com",
  "new_device_token": "d8e12a45-6677-49f3-8f0b-489025ceba39"
}
# Expected Response (200 OK):
{
  "success": true,
  "message": "Device rebound successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "1",
    "email": "john@gmail.com",
    "is_admin": false
  }
}


# ..........................................................
# API 3: Get Authenticated User Profile
# ..........................................................
# Method: GET
# URL: https://dgapp.onrender.com/api/users/me
# Headers: Authorization: Bearer <YOUR_ACCESS_TOKEN>
# Request Body: None
# Expected Response (200 OK):
{
  "id": "1",
  "email": "john@gmail.com",
  "is_admin": false
}


# ..........................................................
# API 4: Get All Products / Search / Filter by Category
# ..........................................................
# Method: GET
# URL Options:
#   - Get all: https://dgapp.onrender.com/api/products/
#   - Filter category: https://dgapp.onrender.com/api/products/?category=Shoes
#   - Search name: https://dgapp.onrender.com/api/products/?search=Nike
# Headers: None required
# Request Body: None
# Expected Response (200 OK):
[
  {
    "id": "1",
    "name": "Nike Air Max",
    "category": "Shoes",
    "price": 120.00,
    "quantity": 50,
    "info": {
      "brand": "Nike",
      "color": "Black",
      "sizes": [40, 41, 42]
    },
    "images": [
      "/products/nike-air-1.jpg",
      "/products/nike-air-2.jpg"
    ]
  }
]


# ..........................................................
# API 5: Get Single Product Details by ID
# ..........................................................
# Method: GET
# URL: https://dgapp.onrender.com/api/products/1
# Headers: None required
# Request Body: None
# Expected Response (200 OK):
{
  "id": "1",
  "name": "Nike Air Max",
  "category": "Shoes",
  "price": 120.00,
  "quantity": 50,
  "info": {
    "brand": "Nike",
    "color": "Black",
    "sizes": [40, 41, 42]
  },
  "images": [
    "/products/nike-air-1.jpg",
    "/products/nike-air-2.jpg"
  ]
}


# ..........................................................
# API 6: Fetch Active User Shopping Cart
# ..........................................................
# Method: GET
# URL: https://dgapp.onrender.com/api/carts/
# Headers: Authorization: Bearer <YOUR_ACCESS_TOKEN>
# Request Body: None
# Expected Response (200 OK):
{
  "id": "1",
  "user_id": "1",
  "items": [
    {
      "product_id": 1,
      "name": "Nike Air Max",
      "price": 120,
      "quantity": 2,
      "subtotal": 240
    }
  ],
  "total_price": 240.00
}


# ..........................................................
# API 7: Update Shopping Cart (Add / Remove / Modify)
# ..........................................................
# Method: PUT
# URL: https://dgapp.onrender.com/api/carts/
# Headers:
#   Authorization: Bearer <YOUR_ACCESS_TOKEN>
#   Content-Type: application/json
# Request Body:
{
  "items": [
    {
      "product_id": 1,
      "name": "Nike Air Max",
      "price": 120,
      "quantity": 2,
      "subtotal": 240
    },
    {
      "product_id": 2,
      "name": "Leather Bag",
      "price": 50,
      "quantity": 1,
      "subtotal": 50
    }
  ],
  "total_price": 290.00
}
# Expected Response (200 OK):
{
  "id": "1",
  "user_id": "1",
  "items": [
    {
      "product_id": 1,
      "name": "Nike Air Max",
      "price": 120,
      "quantity": 2,
      "subtotal": 240
    },
    {
      "product_id": 2,
      "name": "Leather Bag",
      "price": 50,
      "quantity": 1,
      "subtotal": 50
    }
  ],
  "total_price": 290.00
}


# ..........................................................
# API 8: Clear Shopping Cart
# ..........................................................
# Method: DELETE
# URL: https://dgapp.onrender.com/api/carts/
# Headers: Authorization: Bearer <YOUR_ACCESS_TOKEN>
# Request Body: None
# Expected Response (200 OK):
{
  "id": "1",
  "user_id": "1",
  "items": [],
  "total_price": 0.00
}


# ..........................................................
# API 9: Checkout / Create Order
# ..........................................................
# Method: POST
# URL: https://dgapp.onrender.com/api/orders/
# Headers:
#   Authorization: Bearer <YOUR_ACCESS_TOKEN>
#   Content-Type: application/json
# Request Body:
{
  "id": "33333333-3333-3333-3333-333333333333",
  "items": [
    {
      "product_id": 1,
      "name": "Nike Air Max",
      "price": 120,
      "quantity": 2,
      "subtotal": 240
    }
  ],
  "total_price": 240.00
}
# Expected Response (200 OK):
{
  "id": "33333333-3333-3333-3333-333333333333",
  "user_id": "1",
  "items": [
    {
      "product_id": 1,
      "name": "Nike Air Max",
      "price": 120,
      "quantity": 2,
      "subtotal": 240
    }
  ],
  "total_price": 240.00,
  "paid": false,
  "delivered": false,
  "created_at": "2026-10-22T20:00:00"
}


# ..........................................................
# API 10: Fetch Customer Order History & Tracking Status
# ..........................................................
# Method: GET
# URL: https://dgapp.onrender.com/api/orders/
# Headers: Authorization: Bearer <YOUR_ACCESS_TOKEN>
# Request Body: None
# Expected Response (200 OK):
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "user_id": "1",
    "items": [
      {
        "product_id": 1,
        "name": "Nike Air Max",
        "price": 120,
        "quantity": 2,
        "subtotal": 240
      }
    ],
    "total_price": 240.00,
    "paid": true,
    "delivered": false,
    "created_at": "2026-10-22T20:00:00"
  }
]